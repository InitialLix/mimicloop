import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { exportFullBackup, restoreFullBackup, verifyBackupHash } from "../../src/db/backup-service.js";
import { openDatabase, migrateDatabase } from "../../src/db/client.js";
import {
  ContentRepository,
  loadApprovedCollocationSeed,
  loadCollocationCandidateSeed,
  loadSeedBundle,
} from "../../src/db/content-repository.js";
import { LearningRepository } from "../../src/db/learning-repository.js";
import { sha256, type JsonObject } from "../../src/db/json.js";
import { applyCandidateReview } from "../../src/domain/content/candidate-review.js";
import { applyCollocationReview } from "../../src/domain/content/collocation-review.js";
import { candidateValidationErrors, collocationValidationErrors } from "../../src/lib/content-validation.js";
import type { CandidateData, CollocationData } from "../../src/lib/content-types.js";

function collocationReviewFields(candidate: CollocationData) {
  return {
    canonicalText: candidate.canonical_text,
    translationPrompt: candidate.translation_prompt,
    pattern: candidate.pattern,
    slots: candidate.slots,
    expressionType: candidate.expression_type,
    grammarPattern: candidate.grammar_pattern,
    usageNote: candidate.usage_note,
    commonError: candidate.common_error,
    acceptedAnswers: candidate.accepted_answers,
    topics: candidate.topics,
    argumentFunctions: candidate.argument_functions,
    uncertainties: candidate.uncertainties,
  };
}

describe("SQLite content foundation", () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-db-test-"));
  });

  afterAll(async () => {
    const resolved = path.resolve(temporaryDirectory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to remove a non-temporary path");
    await rm(resolved, { recursive: true, force: true });
  });

  it("migrates repeatedly, imports seeds idempotently, and survives reopening", async () => {
    const databasePath = path.join(temporaryDirectory, "primary.db");
    let connection = openDatabase(databasePath);
    migrateDatabase(connection);
    migrateDatabase(connection);

    const repository = new ContentRepository(connection);
    const bundle = await loadSeedBundle();
    const collocationBundle = await loadCollocationCandidateSeed();
    const approvedCollocationBundle = await loadApprovedCollocationSeed();
    const first = repository.importSeeds(bundle, "2026-08-16T09:00:00.000Z");
    const second = repository.importSeeds(bundle, "2026-08-16T09:01:00.000Z");
    const firstCollocations = repository.importCollocationCandidates(collocationBundle, "2026-08-17T09:00:00.000Z");
    const secondCollocations = repository.importCollocationCandidates(collocationBundle, "2026-08-17T09:01:00.000Z");
    const firstApprovedCollocations = repository.importApprovedCollocations(approvedCollocationBundle, "2026-08-17T09:02:00.000Z");
    const secondApprovedCollocations = repository.importApprovedCollocations(approvedCollocationBundle, "2026-08-17T09:03:00.000Z");
    expect(first.alreadyImported).toBe(false);
    expect(second.alreadyImported).toBe(true);
    expect(firstCollocations.alreadyImported).toBe(false);
    expect(secondCollocations.alreadyImported).toBe(true);
    expect(firstApprovedCollocations.alreadyImported).toBe(false);
    expect(secondApprovedCollocations.alreadyImported).toBe(true);
    const approvedSourceLinkCount = approvedCollocationBundle.reduce(
      (sum, item) => sum + ((item.source_links as unknown[])?.length ?? 0),
      0,
    );
    const recallUseCount = approvedCollocationBundle.filter(
      (item) => item.learning_mode === "recall_use",
    ).length;
    expect(repository.getCounts()).toEqual({
      sources: bundle.sources.length,
      candidates: bundle.candidates.length,
      cards: bundle.approvedCards.length,
      attempts: 0,
      reviewStates: bundle.approvedCards.length,
      collocationCandidates: collocationBundle.length,
      collocations: approvedCollocationBundle.length,
      collocationSourceLinks: approvedSourceLinkCount,
      collocationAttempts: 0,
      collocationProgress: recallUseCount,
    });
    connection.close();

    connection = openDatabase(databasePath);
    migrateDatabase(connection);
    expect(new ContentRepository(connection).getCounts().cards).toBe(bundle.approvedCards.length);
    connection.close();
  });

  it("rejects a changed record that reuses an existing id", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "conflict.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const bundle = await loadSeedBundle();
      repository.importSeeds(bundle);
      const changedBundle = structuredClone(bundle);
      changedBundle.approvedCards[0].translation_zh = "冲突内容";
      expect(() => repository.importSeeds(changedBundle)).toThrow(/Import conflict/);
      expect(repository.getCounts().cards).toBe(bundle.approvedCards.length);

      const revisedBundle = structuredClone(bundle);
      const revisedCard = revisedBundle.approvedCards[0];
      revisedCard.translation_zh = "经人工批准的新版释义";
      revisedCard.content_revision = Number(revisedCard.content_revision) + 1;
      const revisedCandidate = revisedBundle.candidates.find(
        (candidate) => (candidate.card as JsonObject).id === revisedCard.id,
      )!;
      (revisedCandidate.card as JsonObject).translation_zh = revisedCard.translation_zh;
      (revisedCandidate.card as JsonObject).content_revision = revisedCard.content_revision;
      connection.sqlite.prepare("UPDATE cards SET is_favorite = 1 WHERE id = ?").run(revisedCard.id);
      expect(repository.importSeeds(revisedBundle).alreadyImported).toBe(false);
      const updated = connection.sqlite
        .prepare("SELECT raw_json AS rawJson, is_favorite AS isFavorite FROM cards WHERE id = ?")
        .get(revisedCard.id) as { rawJson: string; isFavorite: number };
      expect((JSON.parse(updated.rawJson) as JsonObject).translation_zh).toBe("经人工批准的新版释义");
      expect(updated.isFavorite).toBe(1);
      expect(repository.getCounts().reviewStates).toBe(bundle.approvedCards.length);
    } finally {
      connection.close();
    }
  });

  it("updates source metadata only when the archived text hash is unchanged", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "source-metadata.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const bundle = await loadSeedBundle();
      repository.importSeeds(bundle);

      const metadataRevision = structuredClone(bundle);
      metadataRevision.sources[0].title = "经核对的来源标题";
      expect(repository.importSeeds(metadataRevision).alreadyImported).toBe(false);
      expect(repository.listSources().find((source) => source.id === metadataRevision.sources[0].id)?.title)
        .toBe("经核对的来源标题");

      const changedText = structuredClone(metadataRevision);
      changedText.sources[0].full_text = `${changedText.sources[0].full_text} altered`;
      changedText.sources[0].content_hash = "a".repeat(64);
      expect(() => repository.importSeeds(changedText)).toThrow(/changed source text/);
    } finally {
      connection.close();
    }
  });

  it("exports a valid full backup and restores an empty database", async () => {
    const sourceConnection = openDatabase(path.join(temporaryDirectory, "backup-source.db"));
    migrateDatabase(sourceConnection);
    const sourceRepository = new ContentRepository(sourceConnection);
    const seedBundle = await loadSeedBundle();
    const collocationSeed = await loadCollocationCandidateSeed();
    sourceRepository.importSeeds(seedBundle);
    sourceRepository.importCollocationCandidates(collocationSeed);
    sourceConnection.sqlite
      .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run(
        "collocation_use_started_at",
        JSON.stringify("2026-08-18T05:49:36.821Z"),
        "2026-08-18T05:49:36.821Z",
      );
    sourceConnection.sqlite
      .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run(
        "learner_model_evidence_started_at",
        JSON.stringify("2026-08-16T05:00:00.000Z"),
        "2026-08-19T13:21:16.859Z",
      );
    const collocationCandidate = (sourceRepository.listCollocationCandidates() as unknown as CollocationData[])
      .find((item) => item.learning_mode === "recall_use" && item.exercise_seed.guided_application)!;
    const approvedCollocation = applyCollocationReview(collocationCandidate, {
      action: "approve",
      expectedRevision: collocationCandidate.content_revision,
      reason: "验证搭配候选批准后进入正式库并随备份恢复。",
      fields: collocationReviewFields(collocationCandidate),
    }, "2026-08-17T09:05:00.000Z");
    expect(collocationValidationErrors(approvedCollocation)).toEqual([]);
    sourceRepository.saveReviewedCollocationCandidate(approvedCollocation as unknown as JsonObject, true);
    const firstCardId = sourceRepository.listCards()[0].id as string;
    sourceConnection.sqlite
      .prepare(
        `INSERT INTO attempts
         (id, card_id, exercise_type, prompt_snapshot, user_answer, self_rating,
          hint_used, attempt_count, duration_ms, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "da09c380-d9d9-4a4b-a2d1-e3aa3bd749fe",
        firstCardId,
        "translation_recall",
        "测试提示",
        "test answer",
        "recalled",
        0,
        1,
        1200,
        "2026-08-16T09:10:00.000Z",
      );
    const backup = exportFullBackup(sourceConnection, {
      backupId: "f73929a0-a128-46c0-9588-53f7a3b11fc4",
      exportedAt: "2026-08-16T09:20:00.000Z",
      timezone: "Asia/Shanghai",
    });
    expect(verifyBackupHash(backup)).toBe(true);
    expect(backup.schema_version).toBe("1.11.0");
    expect(backup.learning_evidence).toHaveLength(1);
    expect(backup.collocation_candidates).toHaveLength(collocationSeed.length);
    expect(backup.collocations).toHaveLength(1);
    expect(backup.settings.collocation_use_started_at).toBe("2026-08-18T05:49:36.821Z");
    expect(backup.settings.learner_model_evidence_started_at).toBe("2026-08-16T05:00:00.000Z");
    sourceConnection.close();

    const restoredConnection = openDatabase(path.join(temporaryDirectory, "restored.db"));
    try {
      migrateDatabase(restoredConnection);
      const result = await restoreFullBackup(restoredConnection, backup, {
        rollbackDirectory: path.join(temporaryDirectory, "rollback-empty"),
        restoredAt: "2026-08-16T09:30:00.000Z",
      });
      expect(result.rollbackBackupPath).toBeNull();
      expect(result.counts).toEqual({
        sources: seedBundle.sources.length,
        candidates: seedBundle.candidates.length,
        cards: seedBundle.approvedCards.length,
        attempts: 1,
        reviewStates: seedBundle.approvedCards.length,
        collocationCandidates: collocationSeed.length,
        collocations: 1,
        collocationSourceLinks: approvedCollocation.source_links.length,
        collocationAttempts: 0,
        collocationProgress: 1,
      });
      expect(exportFullBackup(restoredConnection).attempts).toHaveLength(1);
      expect(exportFullBackup(restoredConnection).collocations).toHaveLength(1);
      expect(exportFullBackup(restoredConnection).settings.collocation_use_started_at)
        .toBe("2026-08-18T05:49:36.821Z");
      expect(exportFullBackup(restoredConnection).settings.learner_model_evidence_started_at)
        .toBe("2026-08-16T05:00:00.000Z");
    } finally {
      restoredConnection.close();
    }
  });

  it("restores a legacy v1.0 backup with empty collocation collections", async () => {
    const sourceConnection = openDatabase(path.join(temporaryDirectory, "legacy-source.db"));
    migrateDatabase(sourceConnection);
    const seedBundle = await loadSeedBundle();
    new ContentRepository(sourceConnection).importSeeds(seedBundle);
    const current = exportFullBackup(sourceConnection);
    sourceConnection.close();
    const {
      payload_hash: _payloadHash,
      collocation_candidates: _collocationCandidates,
      collocations: _collocations,
      collocation_source_links: _collocationSourceLinks,
      collocation_attempts: _collocationAttempts,
      collocation_progress: _collocationProgress,
      agent_traces: _agentTraces,
      use_evaluation_runs: _useEvaluationRuns,
      learning_evidence: _learningEvidence,
      adaptive_training_decisions: _adaptiveTrainingDecisions,
      adaptive_retests: _adaptiveRetests,
      guided_writing_sessions: _guidedWritingSessions,
      guided_writing_turns: _guidedWritingTurns,
      guided_writing_paragraph_drafts: _guidedWritingParagraphDrafts,
      ...legacyFields
    } = current;
    const legacyPayload = { ...legacyFields, schema_version: "1.0.0" as const };
    const legacyBackup = { ...legacyPayload, payload_hash: sha256(legacyPayload) };

    const restoredConnection = openDatabase(path.join(temporaryDirectory, "legacy-restored.db"));
    try {
      migrateDatabase(restoredConnection);
      const result = await restoreFullBackup(restoredConnection, legacyBackup, {
        rollbackDirectory: path.join(temporaryDirectory, "legacy-rollback"),
      });
      expect(result.counts).toMatchObject({
        cards: seedBundle.approvedCards.length,
        collocationCandidates: 0,
        collocations: 0,
        collocationProgress: 0,
      });
    } finally {
      restoredConnection.close();
    }
  });

  it("records Recall as progress and schedules review only after Use", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "learning.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const seedBundle = await loadSeedBundle();
      repository.importSeeds(seedBundle);
      const cardId = repository.listCards()[0].id as string;
      const learning = new LearningRepository(connection);
      const recallResult = learning.recordTranslationRecall({
        cardId,
        promptSnapshot: "测试中文提示",
        userAnswer: "A learner answer",
        selfRating: "recalled",
        hintUsed: true,
        durationMs: 2500,
        completedAt: "2026-08-16T10:00:00.000Z",
      });
      expect(recallResult).not.toHaveProperty("dueAt");
      expect(repository.getCounts().attempts).toBe(1);
      const inProgressState = connection.sqlite
        .prepare("SELECT learning_stage AS stage, success_streak AS streak, last_reviewed_at AS lastReviewedAt FROM review_states WHERE card_id = ?")
        .get(cardId) as { stage: string; streak: number; lastReviewedAt: string | null };
      expect(inProgressState).toEqual({ stage: "new", streak: 0, lastReviewedAt: null });

      const useResult = learning.recordUseAttempt({
        exerciseType: "slot_replacement",
        cardId,
        promptSnapshot: "测试槽位替换提示",
        userAnswer: "A learner transfer sentence",
        selfRating: "recalled",
        hintUsed: true,
        durationMs: 3200,
        completedAt: "2026-08-16T10:05:00.000Z",
      });
      expect(useResult.dueAt).toBe("2026-08-16T16:00:00.000Z");
      expect(repository.getCounts().attempts).toBe(2);
      const state = connection.sqlite
        .prepare("SELECT learning_stage AS stage, success_streak AS streak, due_at AS dueAt FROM review_states WHERE card_id = ?")
        .get(cardId) as { stage: string; streak: number; dueAt: string };
      expect(state).toEqual({ stage: "recall", streak: 1, dueAt: "2026-08-16T16:00:00.000Z" });
    } finally {
      connection.close();
    }
  });

  it("records Collocation Recall but schedules review only after Collocation Use", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "collocation-learning.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const seedBundle = await loadSeedBundle();
      repository.importSeeds(seedBundle);
      repository.importApprovedCollocations(await loadApprovedCollocationSeed());
      const collocation = (repository.listCollocations() as unknown as CollocationData[])
        .find((item) => item.learning_mode === "recall_use")!;
      const learning = new LearningRepository(connection);

      learning.markCollocationLearned(collocation.id, "2026-08-16T09:55:00.000Z");
      const learned = connection.sqlite
        .prepare("SELECT learning_stage AS stage, due_at AS dueAt FROM collocation_progress WHERE collocation_id = ?")
        .get(collocation.id) as { stage: string; dueAt: string };
      expect(learned).toEqual({ stage: "learned", dueAt: "2026-08-16T09:55:00.000Z" });

      const result = learning.recordCollocationRecall({
        collocationId: collocation.id,
        promptSnapshot: collocation.translation_prompt,
        userAnswer: `${collocation.canonical_text.toUpperCase()}!`,
        selfRating: "recalled",
        hintUsed: true,
        durationMs: 1800,
        completedAt: "2026-08-16T10:00:00.000Z",
      });
      expect(result.matchResult).toBe("canonical");
      expect(result).not.toHaveProperty("dueAt");
      expect(repository.getCounts()).toMatchObject({ attempts: 0, collocationAttempts: 1 });
      const progress = connection.sqlite
        .prepare(
          `SELECT learning_stage AS stage, recall_score AS recallScore,
                  success_streak AS streak, due_at AS dueAt
           FROM collocation_progress WHERE collocation_id = ?`,
        )
        .get(collocation.id) as { stage: string; recallScore: number; streak: number; dueAt: string };
      expect(progress).toEqual({
        stage: "recall",
        recallScore: 0.75,
        streak: 0,
        dueAt: "2026-08-16T09:55:00.000Z",
      });

      const useResult = learning.recordCollocationUse({
        exerciseType: "guided_application",
        collocationId: collocation.id,
        promptSnapshot: "政府有一个有说服力的理由推迟这项决定。",
        userAnswer: "The government has a compelling reason to delay the decision.",
        selfRating: "recalled",
        hintUsed: true,
        durationMs: 2600,
        completedAt: "2026-08-16T10:05:00.000Z",
      });
      expect(useResult.dueAt).toBe("2026-08-16T16:00:00.000Z");
      expect(repository.getCounts()).toMatchObject({ attempts: 0, collocationAttempts: 2 });
      const completed = connection.sqlite
        .prepare(
          `SELECT learning_stage AS stage, application_score AS applicationScore,
                  success_streak AS streak, due_at AS dueAt
           FROM collocation_progress WHERE collocation_id = ?`,
        )
        .get(collocation.id) as { stage: string; applicationScore: number; streak: number; dueAt: string };
      expect(completed).toEqual({
        stage: "recall",
        applicationScore: 0.75,
        streak: 1,
        dueAt: "2026-08-16T16:00:00.000Z",
      });
    } finally {
      connection.close();
    }
  });

  it("publishes Appreciation expressions without creating Recall or Use progress", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "appreciation.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      repository.importSeeds(await loadSeedBundle());
      const [seed] = await loadApprovedCollocationSeed() as unknown as CollocationData[];
      const appreciation = structuredClone(seed);
      appreciation.learning_mode = "appreciation";
      appreciation.exercise_seed = {};
      repository.importApprovedCollocations([appreciation as unknown as JsonObject]);

      expect(repository.getCounts()).toMatchObject({ collocations: 1, collocationProgress: 0 });
      const learning = new LearningRepository(connection);
      expect(() => learning.recordCollocationRecall({
        collocationId: appreciation.id,
        promptSnapshot: appreciation.translation_prompt,
        userAnswer: appreciation.canonical_text,
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 1000,
        completedAt: "2026-08-19T02:00:00.000Z",
      })).toThrow(`Unknown collocation: ${appreciation.id}`);
      expect(repository.getCounts().collocationAttempts).toBe(0);
    } finally {
      connection.close();
    }
  });

  it("keeps candidate edits as drafts and publishes only after approval", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "candidate-review.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const seedBundle = await loadSeedBundle();
      repository.importSeeds(seedBundle);
      const deferred = repository.listCandidates().find((item) => item.workflow_status === "deferred") as unknown as CandidateData;
      const fields = {
        translationZh: `${deferred.card.translation_zh}（审核草稿）`,
        chunks: deferred.card.chunks,
        pattern: deferred.card.pattern,
        slots: deferred.card.slots,
        grammarNote: deferred.card.grammar_note,
        usageNote: deferred.card.usage_note,
        simplifiedVersion: deferred.card.simplified_version,
        transferExample: deferred.card.transfer_example,
        exerciseSeed: deferred.card.exercise_seed,
        uncertainties: deferred.uncertainties,
      };
      const draft = applyCandidateReview(deferred, {
        action: "save",
        expectedRevision: deferred.card.content_revision,
        reason: "验证候选草稿不会直接发布。",
        fields,
      }, "2026-08-16T13:00:00.000Z");
      expect(candidateValidationErrors(draft)).toEqual([]);
      repository.saveReviewedCandidate(draft as unknown as JsonObject, false);
      expect(repository.getCounts().cards).toBe(seedBundle.approvedCards.length);
      expect((repository.getCandidate(deferred.candidate_id) as JsonObject).workflow_status).toBe("needs_edit");

      const approved = applyCandidateReview(draft, {
        action: "approve",
        expectedRevision: draft.card.content_revision,
        reason: "验证批准后发布正式卡。",
        fields,
      }, "2026-08-16T13:05:00.000Z");
      expect(candidateValidationErrors(approved)).toEqual([]);
      repository.saveReviewedCandidate(approved as unknown as JsonObject, true);
      expect(repository.getCounts().cards).toBe(seedBundle.approvedCards.length + 1);
      expect((repository.getCandidate(deferred.candidate_id) as JsonObject).workflow_status).toBe("approved");
    } finally {
      connection.close();
    }
  });

  it("keeps collocations as candidates until review and supports reject and merge", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "collocation-review.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      const seedBundle = await loadSeedBundle();
      const collocationSeed = await loadCollocationCandidateSeed();
      repository.importSeeds(seedBundle);
      repository.importCollocationCandidates(collocationSeed);
      const candidates = repository.listCollocationCandidates() as unknown as CollocationData[];
      const directSourceCandidate = candidates.find((item) => (
        item.learning_mode === "recall_use"
        && Boolean(item.exercise_seed.guided_application)
        && item.source_links.some((link) => link.card_id === null)
      ))!;

      const draft = applyCollocationReview(directSourceCandidate, {
        action: "save",
        expectedRevision: directSourceCandidate.content_revision,
        reason: "验证普通正文来源搭配可先保存为候选修改。",
        fields: collocationReviewFields(directSourceCandidate),
      }, "2026-08-17T10:00:00.000Z");
      expect(collocationValidationErrors(draft)).toEqual([]);
      repository.saveReviewedCollocationCandidate(draft as unknown as JsonObject, false);
      expect(repository.getCounts().collocations).toBe(0);

      const approved = applyCollocationReview(draft, {
        action: "approve",
        expectedRevision: draft.content_revision,
        reason: "验证人工批准后才写入正式搭配库。",
        fields: collocationReviewFields(draft),
      }, "2026-08-17T10:05:00.000Z");
      expect(collocationValidationErrors(approved)).toEqual([]);
      repository.saveReviewedCollocationCandidate(approved as unknown as JsonObject, true);
      expect(repository.getCounts()).toMatchObject({
        cards: seedBundle.approvedCards.length,
        reviewStates: seedBundle.approvedCards.length,
        collocationCandidates: collocationSeed.length,
        collocations: 1,
        collocationSourceLinks: approved.source_links.length,
        collocationProgress: 1,
      });

      const rejectedSource = candidates.find((item) => item.id !== approved.id)!;
      const rejected = applyCollocationReview(rejectedSource, {
        action: "reject",
        expectedRevision: rejectedSource.content_revision,
        reason: "验证驳回不生成正式学习项目。",
        fields: collocationReviewFields(rejectedSource),
      }, "2026-08-17T10:10:00.000Z");
      repository.saveReviewedCollocationCandidate(rejected as unknown as JsonObject, false);
      expect(repository.getCounts().collocations).toBe(1);

      const mergeSource = candidates.find((item) => item.id !== approved.id && item.id !== rejected.id)!;
      const merged = applyCollocationReview(mergeSource, {
        action: "merge",
        expectedRevision: mergeSource.content_revision,
        reason: "验证重复候选可以合并到已批准搭配。",
        mergeTargetId: approved.id,
        fields: collocationReviewFields(mergeSource),
      }, "2026-08-17T10:15:00.000Z");
      expect(collocationValidationErrors(merged)).toEqual([]);
      repository.saveReviewedCollocationCandidate(merged as unknown as JsonObject, false);
      expect(repository.getCounts().collocations).toBe(1);
      expect((repository.getCollocationCandidate(merged.id) as JsonObject).workflow_status).toBe("merged");
    } finally {
      connection.close();
    }
  });

  it("writes a rollback backup before overwriting populated data and rejects tampering", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "overwrite.db"));
    try {
      migrateDatabase(connection);
      const repository = new ContentRepository(connection);
      repository.importSeeds(await loadSeedBundle());
      const backup = exportFullBackup(connection);
      const rollbackDirectory = path.join(temporaryDirectory, "rollbacks");
      const result = await restoreFullBackup(connection, backup, { rollbackDirectory });
      expect(result.rollbackBackupPath).not.toBeNull();
      expect(existsSync(result.rollbackBackupPath!)).toBe(true);

      const tampered = structuredClone(backup);
      (tampered.cards[0] as JsonObject).translation_zh = "被篡改";
      await expect(restoreFullBackup(connection, tampered, { rollbackDirectory })).rejects.toThrow(
        /payload hash mismatch/,
      );
    } finally {
      connection.close();
    }
  });
});
