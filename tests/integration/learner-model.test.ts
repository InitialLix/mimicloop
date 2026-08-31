import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, migrateDatabase } from "../../src/db/client";
import { ContentRepository, loadSeedBundle } from "../../src/db/content-repository";
import { LearningEvidenceRepository } from "../../src/db/learning-evidence-repository";
import { LearningRepository } from "../../src/db/learning-repository";
import { UseEvaluationRepository } from "../../src/db/use-evaluation-repository";
import type { UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";

function evaluation(attemptId: string, confidence: number): UseEvaluationV1 {
  return {
    schema_version: "use-eval.v1",
    attempt_id: attemptId,
    verdict: "pass",
    dimensions: {
      meaning: "complete",
      target_expression: "natural",
      grammar: "ok",
      collocation: "natural",
    },
    errors: [],
    positive_evidence: [{ type: "meaning", span: null, message_zh: "表达完整。" }],
    minimal_hint: null,
    confidence,
    needs_review: false,
  };
}

describe("Phase 2.3 learning evidence", () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-learner-model-"));
  });

  afterAll(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("records attempts append-only, backfills idempotently, and derives delayed retention", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "evidence.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const cardId = String(content.listCards()[0].id);
      const learning = new LearningRepository(connection);

      learning.recordTranslationRecall({
        cardId,
        promptSnapshot: "提示一",
        userAnswer: "First answer.",
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 1000,
        completedAt: "2026-08-20T01:00:00.000Z",
      });
      learning.recordTranslationRecall({
        cardId,
        promptSnapshot: "提示二",
        userAnswer: "Second answer.",
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 900,
        completedAt: "2026-08-24T01:00:00.000Z",
      });

      const evidenceRepository = new LearningEvidenceRepository(connection);
      const beforeSync = evidenceRepository.count();
      expect(beforeSync).toBe(3);
      expect(evidenceRepository.syncAllAttempts()).toEqual({ created: 0, total: 3 });
      expect(evidenceRepository.getLearnerStates()[0]).toMatchObject({
        recall: "stable",
        delayedRetention: "developing",
        spontaneousUse: "unknown",
      });
    } finally {
      connection.close();
    }
  });

  it("keeps low-confidence and reference-shown Use from becoming independent success", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "use-evidence.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const cardId = String(content.listCards()[0].id);
      const evaluationRepository = new UseEvaluationRepository(connection);
      const learning = new LearningRepository(connection);

      for (const item of [
        { attemptId: "11111111-1111-4111-8111-111111111111", confidence: 0.5, hintUsed: false },
        { attemptId: "22222222-2222-4222-8222-222222222222", confidence: 0.99, hintUsed: true },
      ]) {
        evaluationRepository.begin({
          attemptId: item.attemptId,
          exerciseRef: `sentence:${cardId}:slot_replacement:0`,
          exerciseKind: "sentence_use",
          assetId: cardId,
          assetRevision: 1,
          inputHash: item.attemptId.replaceAll("-", "").padEnd(64, "0").slice(0, 64),
          learnerAnswer: "A complete learner sentence.",
          previousAttemptId: null,
          retryIndex: 0,
          learnerIdHash: "local-test",
          promptVersion: "use-evaluator-test",
          schemaVersion: "use-eval.v1",
          provider: "test",
          model: "test-model",
          startedAt: "2026-08-20T01:00:00.000Z",
        });
        evaluationRepository.finalize({
          attemptId: item.attemptId,
          status: "success",
          evaluation: evaluation(item.attemptId, item.confidence),
          feedback: null,
          teachingAction: { type: "PASS" },
          steps: [],
          completedAt: "2026-08-20T01:00:01.000Z",
        });
        learning.recordUseAttempt({
          attemptId: item.attemptId,
          exerciseType: "slot_replacement",
          cardId,
          promptSnapshot: "换场景提示",
          userAnswer: "A complete learner sentence.",
          selfRating: "can_use",
          hintUsed: item.hintUsed,
          durationMs: 1200,
          completedAt: "2026-08-20T01:01:00.000Z",
        });
      }

      const evidence = new LearningEvidenceRepository(connection).listEvidence();
      expect(evidence.map((item) => item.outcome)).toEqual(["not_judged", "partial"]);
      const state = new LearningEvidenceRepository(connection).getLearnerStates()[0];
      expect(state).toMatchObject({ transferUse: "weak", spontaneousUse: "unknown" });
      expect(connection.sqlite.prepare("SELECT success_streak AS streak FROM review_states WHERE card_id = ?").get(cardId))
        .toEqual({ streak: 2 });
    } finally {
      connection.close();
    }
  });

  it("discards pre-cutoff derived evidence without deleting attempts or recreating it", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "evidence-cutoff.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const cardId = String(content.listCards()[0].id);
      const learning = new LearningRepository(connection);

      learning.recordTranslationRecall({
        cardId,
        promptSnapshot: "旧记录",
        userAnswer: "Old answer.",
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 1000,
        completedAt: "2026-08-19T01:00:00.000Z",
      });
      learning.recordTranslationRecall({
        cardId,
        promptSnapshot: "新记录",
        userAnswer: "New answer.",
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 900,
        completedAt: "2026-08-20T01:00:00.000Z",
      });

      const evidenceRepository = new LearningEvidenceRepository(connection);
      expect(evidenceRepository.count()).toBe(2);
      expect(evidenceRepository.discardEvidenceBefore("2026-08-20T00:00:00.000Z", "2026-08-20T02:00:00.000Z"))
        .toEqual({ startedAt: "2026-08-20T00:00:00.000Z", deleted: 1, remaining: 1 });
      expect(evidenceRepository.syncAllAttempts()).toEqual({ created: 0, total: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM attempts").get()).toEqual({ count: 2 });
      expect(evidenceRepository.listEvidence().map((item) => item.occurredAt)).toEqual(["2026-08-20T01:00:00.000Z"]);
    } finally {
      connection.close();
    }
  });
});
