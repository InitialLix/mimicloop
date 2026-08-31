import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, migrateDatabase } from "../../src/db/client";
import { ContentRepository, loadSeedBundle } from "../../src/db/content-repository";
import { LearningRepository } from "../../src/db/learning-repository";
import { UseEvaluationRepository } from "../../src/db/use-evaluation-repository";
import { exportFullBackup, restoreFullBackup } from "../../src/db/backup-service";
import type { UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";
import { buildSentenceUseExerciseRef } from "../../src/domain/practice/use-exercise-ref";
import type { SentenceCardData } from "../../src/lib/content-types";
import { selectAndRecordAdaptiveNextStep } from "../../src/lib/adaptive-training-service";

function passEvaluation(attemptId: string): UseEvaluationV1 {
  return {
    schema_version: "use-eval.v1",
    attempt_id: attemptId,
    verdict: "pass",
    dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
    errors: [],
    positive_evidence: [{ type: "meaning", span: null, message_zh: "表达完整。" }],
    minimal_hint: null,
    confidence: 0.97,
    needs_review: false,
  };
}

function localGrammarEvaluation(attemptId: string): UseEvaluationV1 {
  return {
    ...passEvaluation(attemptId),
    dimensions: { meaning: "complete", target_expression: "natural", grammar: "minor_issue", collocation: "natural" },
    errors: [{
      type: "grammar",
      severity: "non_blocking",
      span: "student nurse",
      message_zh: "这里需要复数。",
    }],
  };
}

describe("Phase 2.4 adaptive training persistence", () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-adaptive-"));
  });

  afterAll(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("records one deterministic decision, trace, and retention retest for duplicate calls", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "adaptive.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const card = (content.listCards() as unknown as SentenceCardData[])
        .find((item) => item.primary_focus !== "vocabulary" && item.exercise_seed.slot_replacement?.length)!;
      const attemptId = "44444444-4444-4444-8444-444444444444";
      const evaluationRepository = new UseEvaluationRepository(connection);
      evaluationRepository.begin({
        attemptId,
        exerciseRef: buildSentenceUseExerciseRef(card, "slot_replacement"),
        exerciseKind: "sentence_use",
        assetId: card.id,
        assetRevision: card.content_revision,
        inputHash: "4".repeat(64),
        learnerAnswer: "A complete transfer sentence.",
        previousAttemptId: null,
        retryIndex: 0,
        learnerIdHash: "local-test",
        promptVersion: "use-evaluator-test",
        schemaVersion: "use-eval.v1",
        provider: "test",
        model: "test-model",
        startedAt: "2026-08-24T05:59:58.000Z",
      });
      evaluationRepository.finalize({
        attemptId,
        status: "success",
        evaluation: passEvaluation(attemptId),
        feedback: null,
        teachingAction: { type: "PASS" },
        steps: [],
        completedAt: "2026-08-24T05:59:59.000Z",
      });
      new LearningRepository(connection).recordUseAttempt({
        attemptId,
        exerciseType: "slot_replacement",
        cardId: card.id,
        promptSnapshot: "测试迁移提示",
        userAnswer: "A complete transfer sentence.",
        selfRating: "can_use",
        hintUsed: false,
        durationMs: 1200,
        completedAt: "2026-08-24T06:00:00.000Z",
      });

      const first = selectAndRecordAdaptiveNextStep(connection, { triggerKind: "sentence_attempt", attemptId });
      const duplicate = selectAndRecordAdaptiveNextStep(connection, { triggerKind: "sentence_attempt", attemptId });
      expect(first.action).toEqual({ type: "ADVANCE" });
      expect(first.retest).toMatchObject({ purpose: "retention", dueAt: "2026-08-27T06:00:00.000Z", status: "scheduled" });
      expect(duplicate.id).toBe(first.id);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM adaptive_training_decisions").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM adaptive_retests").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces WHERE feature = 'adaptive_training'").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM attempts").get()).toEqual({ count: 1 });

      const backup = exportFullBackup(connection);
      expect(backup.schema_version).toBe("1.11.0");
      expect(backup.adaptive_training_decisions).toHaveLength(1);
      expect(backup.adaptive_retests).toHaveLength(1);
      const restored = openDatabase(path.join(temporaryDirectory, "adaptive-restored.db"));
      try {
        migrateDatabase(restored);
        await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback") });
        expect(restored.sqlite.prepare("SELECT COUNT(*) AS count FROM adaptive_training_decisions").get()).toEqual({ count: 1 });
        expect(restored.sqlite.prepare("SELECT COUNT(*) AS count FROM adaptive_retests").get()).toEqual({ count: 1 });
      } finally {
        restored.close();
      }
    } finally {
      connection.close();
    }
  });

  it("keeps legacy or unavailable evaluation on the existing advance path", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "adaptive-fallback.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const card = (content.listCards() as unknown as SentenceCardData[])
        .find((item) => item.primary_focus !== "vocabulary" && item.exercise_seed.slot_replacement?.length)!;
      const attemptId = "55555555-5555-4555-8555-555555555555";
      new LearningRepository(connection).recordUseAttempt({
        attemptId,
        exerciseType: "slot_replacement",
        cardId: card.id,
        promptSnapshot: "测试回退提示",
        userAnswer: "A legacy learner sentence.",
        selfRating: "recalled",
        hintUsed: false,
        durationMs: 800,
        completedAt: "2026-08-24T07:00:00.000Z",
      });
      const result = selectAndRecordAdaptiveNextStep(connection, { triggerKind: "sentence_attempt", attemptId });
      expect(result.action).toEqual({ type: "ADVANCE" });
      expect(result.reasonCodes).toContain("EVALUATION_UNAVAILABLE");
      expect(result.retest).toBeNull();
    } finally {
      connection.close();
    }
  });

  it("uses the saved evaluation chain to schedule a quick confirmation after one local correction", async () => {
    const connection = openDatabase(path.join(temporaryDirectory, "adaptive-local-correction.db"));
    try {
      migrateDatabase(connection);
      const content = new ContentRepository(connection);
      content.importSeeds(await loadSeedBundle());
      const card = (content.listCards() as unknown as SentenceCardData[])
        .find((item) => item.primary_focus !== "vocabulary" && item.exercise_seed.slot_replacement?.length)!;
      const exerciseRef = buildSentenceUseExerciseRef(card, "slot_replacement");
      const previousAttemptId = "66666666-6666-4666-8666-666666666666";
      const finalAttemptId = "77777777-7777-4777-8777-777777777777";
      const evaluationRepository = new UseEvaluationRepository(connection);

      evaluationRepository.begin({
        attemptId: previousAttemptId,
        exerciseRef,
        exerciseKind: "sentence_use",
        assetId: card.id,
        assetRevision: card.content_revision,
        inputHash: "6".repeat(64),
        learnerAnswer: "One student nurse use the expression.",
        previousAttemptId: null,
        retryIndex: 0,
        learnerIdHash: "local-test",
        promptVersion: "use-evaluator-test",
        schemaVersion: "use-eval.v1",
        provider: "test",
        model: "test-model",
        startedAt: "2026-08-24T07:59:55.000Z",
      });
      evaluationRepository.finalize({
        attemptId: previousAttemptId,
        status: "success",
        evaluation: localGrammarEvaluation(previousAttemptId),
        feedback: null,
        teachingAction: { type: "PASS" },
        steps: [],
        completedAt: "2026-08-24T07:59:56.000Z",
      });
      evaluationRepository.begin({
        attemptId: finalAttemptId,
        exerciseRef,
        exerciseKind: "sentence_use",
        assetId: card.id,
        assetRevision: card.content_revision,
        inputHash: "7".repeat(64),
        learnerAnswer: "Student nurses use the expression.",
        previousAttemptId,
        retryIndex: 1,
        learnerIdHash: "local-test",
        promptVersion: "use-evaluator-test",
        schemaVersion: "use-eval.v1",
        provider: "test",
        model: "test-model",
        startedAt: "2026-08-24T07:59:57.000Z",
      });
      evaluationRepository.finalize({
        attemptId: finalAttemptId,
        status: "success",
        evaluation: passEvaluation(finalAttemptId),
        feedback: null,
        teachingAction: { type: "PASS" },
        steps: [],
        completedAt: "2026-08-24T07:59:59.000Z",
      });
      new LearningRepository(connection).recordUseAttempt({
        attemptId: finalAttemptId,
        exerciseType: "slot_replacement",
        cardId: card.id,
        promptSnapshot: "测试局部修正",
        userAnswer: "Student nurses use the expression.",
        selfRating: "can_use",
        hintUsed: true,
        durationMs: 1600,
        completedAt: "2026-08-24T08:00:00.000Z",
      });

      const result = selectAndRecordAdaptiveNextStep(connection, {
        triggerKind: "sentence_attempt",
        attemptId: finalAttemptId,
      });
      expect(result.action).toEqual({ type: "ADVANCE" });
      expect(result.reasonCodes).toContain("LOCAL_CORRECTION_PASS");
      expect(result.retest).toMatchObject({
        purpose: "quick_confirmation",
        dueAt: "2026-08-24T16:00:00.000Z",
        status: "scheduled",
      });
      expect(connection.sqlite.prepare(
        "SELECT purpose, due_at AS dueAt FROM adaptive_retests WHERE source_decision_id = ?",
      ).get(result.id)).toEqual({ purpose: "quick_confirmation", dueAt: "2026-08-24T16:00:00.000Z" });
    } finally {
      connection.close();
    }
  });
});
