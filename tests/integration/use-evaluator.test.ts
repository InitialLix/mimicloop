import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { exportFullBackup, restoreFullBackup, type FullBackup } from "../../src/db/backup-service";
import { migrateDatabase, openDatabase } from "../../src/db/client";
import { sha256 } from "../../src/db/json";
import { ContentRepository, loadApprovedCollocationSeed, loadSeedBundle } from "../../src/db/content-repository";
import { AttemptIdConflictError, LearningRepository } from "../../src/db/learning-repository";
import { IdempotencyConflictError, UseEvaluationRepository } from "../../src/db/use-evaluation-repository";
import { buildCollocationUseExerciseRef, buildSentenceUseExerciseRef } from "../../src/domain/practice/use-exercise-ref";
import type { UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";
import { buildUseTask } from "../../src/domain/practice/use-task";
import type { UseEvaluatorProvider } from "../../src/lib/ai/use-evaluator-provider";
import type { CollocationData, SentenceCardData } from "../../src/lib/content-types";
import { evaluateCollocationUseAttempt, evaluateUseAttempt } from "../../src/lib/use-evaluation-service";

describe("Phase 2.1–2.2 Use evaluator persistence", () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-use-evaluator-"));
  });

  afterAll(async () => {
    const resolved = path.resolve(temporaryDirectory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to remove a non-temporary path");
    await rm(resolved, { recursive: true, force: true });
  });

  async function seededConnection(name: string) {
    const connection = openDatabase(path.join(temporaryDirectory, name));
    migrateDatabase(connection);
    const repository = new ContentRepository(connection);
    repository.importSeeds(await loadSeedBundle());
    repository.importApprovedCollocations(await loadApprovedCollocationSeed());
    const collocation = (repository.listCollocations() as unknown as CollocationData[])
      .find((item) => item.learning_mode === "recall_use" && item.exercise_seed.guided_application)!;
    return { connection, collocation };
  }

  it("stores one validated evaluation and trace under duplicate HTTP-style submissions", async () => {
    const { connection, collocation } = await seededConnection("idempotent.db");
    try {
      const attemptId = "da09c380-d9d9-4a4b-a2d1-e3aa3bd749fe";
      const answer = collocation.exercise_seed.guided_application!.reference_answer;
      const output: UseEvaluationV1 = {
        schema_version: "use-eval.v1",
        attempt_id: attemptId,
        verdict: "pass",
        dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
        errors: [],
        positive_evidence: [{
          type: "target_expression",
          span: collocation.exercise_seed.guided_application!.target_surface,
          message_zh: "目标搭配使用自然。",
        }],
        minimal_hint: null,
        confidence: 0.96,
        needs_review: false,
      };
      const evaluate = vi.fn(async () => ({
        output,
        provider: "fixture",
        model: "gold-fixture-v1",
        promptVersion: "use-evaluator-v11",
        schemaVersion: "use-eval.v1",
        inputTokens: 100,
        outputTokens: 60,
        latencyMs: 5,
      }));
      const provider: UseEvaluatorProvider = { evaluate };
      const request = {
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: answer,
        provider,
      };
      const first = await evaluateCollocationUseAttempt(request);
      const duplicate = await evaluateCollocationUseAttempt(request);
      expect(first).toMatchObject({ status: "evaluated", duplicate: false, model: "gold-fixture-v1" });
      expect(duplicate).toMatchObject({
        status: "evaluated",
        duplicate: true,
        traceId: first.traceId,
        model: "gold-fixture-v1",
      });
      expect(evaluate).toHaveBeenCalledTimes(1);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM use_evaluation_runs").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces").get()).toEqual({ count: 1 });
      const trace = new UseEvaluationRepository(connection).getTrace(first.traceId);
      expect(trace).toMatchObject({
        feature: "use_evaluator",
        status: "success",
        provider: "fixture",
        model: "gold-fixture-v1",
        promptVersion: "use-evaluator-v11",
        schemaVersion: "use-eval.v1",
        inputTokens: 100,
        outputTokens: 60,
      });
      expect(trace?.steps.map((item) => [item.kind, item.name])).toEqual([
        ["db_read", "load_use_exercise"],
        ["model_call", "evaluate_answer"],
        ["validation", "validate_evaluation"],
        ["db_write", "record_evaluation"],
      ]);
      expect(JSON.stringify(trace)).not.toContain(answer);

      await expect(evaluateCollocationUseAttempt({ ...request, learnerAnswer: `${answer} Changed.` }))
        .rejects.toBeInstanceOf(IdempotencyConflictError);
    } finally {
      connection.close();
    }
  });

  it("persists a non-blocking mechanical typo as PASS with explicit typo feedback", async () => {
    const { connection, collocation } = await seededConnection("mechanical-typo.db");
    try {
      const attemptId = "93d03e4e-0da5-46b6-a7a9-f6f0aa10f6c7";
      const answer = `Thee ${collocation.exercise_seed.guided_application!.reference_answer}`;
      const output: UseEvaluationV1 = {
        schema_version: "use-eval.v1",
        attempt_id: attemptId,
        verdict: "pass",
        dimensions: { meaning: "complete", target_expression: "natural", grammar: "minor_issue", collocation: "natural" },
        errors: [{
          type: "typo",
          severity: "non_blocking",
          span: null,
          message_zh: "Thee 多输入了一个字母 e。",
        }],
        positive_evidence: [{ type: "target_expression", span: null, message_zh: "目标表达使用自然。" }],
        minimal_hint: null,
        confidence: 0.97,
        needs_review: false,
      };
      const result = await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: answer,
        provider: {
          evaluate: vi.fn(async () => ({
            output,
            provider: "fixture",
            model: "typo-fixture-v1",
            promptVersion: "use-evaluator-v11",
            schemaVersion: "use-eval.v1",
            inputTokens: 100,
            outputTokens: 60,
            latencyMs: 5,
          })),
        },
      });
      expect(result).toMatchObject({
        status: "evaluated",
        teachingAction: { type: "PASS" },
        feedback: {
          issue: "Thee 多输入了一个字母 e。",
          issueType: "typo",
          issueSeverity: "non_blocking",
          surfaceNote: null,
          typoOnly: true,
        },
      });
      expect(new UseEvaluationRepository(connection).get(attemptId)?.feedback).toMatchObject({ typoOnly: true });
    } finally {
      connection.close();
    }
  });

  it("automatically retries one fabricated evidence span before falling back", async () => {
    const { connection, collocation } = await seededConnection("automatic-evidence-retry.db");
    try {
      const attemptId = "284ba9de-1197-484c-8324-769a0a0cf056";
      const answer = collocation.exercise_seed.guided_application!.reference_answer;
      const validOutput: UseEvaluationV1 = {
        schema_version: "use-eval.v1",
        attempt_id: attemptId,
        verdict: "pass",
        dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
        errors: [],
        positive_evidence: [{ type: "meaning", span: null, message_zh: "核心意思表达完整。" }],
        minimal_hint: null,
        confidence: 0.96,
        needs_review: false,
      };
      const evaluate = vi.fn()
        .mockResolvedValueOnce({
          output: {
            ...validOutput,
            positive_evidence: [{ type: "meaning", span: "learner never wrote this", message_zh: "核心意思表达完整。" }],
          },
          provider: "fixture",
          model: "evidence-retry-fixture-v1",
          promptVersion: "use-evaluator-v11",
          schemaVersion: "use-eval.v1",
          inputTokens: 100,
          outputTokens: 60,
          latencyMs: 2,
        })
        .mockResolvedValueOnce({
          output: validOutput,
          provider: "fixture",
          model: "evidence-retry-fixture-v1",
          promptVersion: "use-evaluator-v11",
          schemaVersion: "use-eval.v1",
          inputTokens: 110,
          outputTokens: 55,
          latencyMs: 2,
        });
      const result = await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: answer,
        provider: { evaluate },
      });
      expect(result).toMatchObject({ status: "evaluated", teachingAction: { type: "PASS" } });
      expect(evaluate).toHaveBeenCalledTimes(2);
      const trace = new UseEvaluationRepository(connection).getTrace(result.traceId);
      expect(trace).toMatchObject({ inputTokens: 210, outputTokens: 115 });
      expect(trace?.steps.map((item) => [item.kind, item.name, item.outcome])).toEqual([
        ["db_read", "load_use_exercise", "approved_exercise_loaded"],
        ["model_call", "evaluate_answer", "response_received"],
        ["validation", "validate_evaluation", "invalid"],
        ["model_call", "retry_invalid_evidence", "response_received"],
        ["validation", "validate_evaluation", "valid"],
        ["db_write", "record_evaluation", "success"],
      ]);
    } finally {
      connection.close();
    }
  });

  it("persists a bounded retry chain and never repeats the same minimal hint", async () => {
    const { connection, collocation } = await seededConnection("teaching-actions.db");
    const exerciseRef = buildCollocationUseExerciseRef(collocation);
    const attempts = [
      "2d5fc535-83b8-465e-9c19-0d554b4291d5",
      "c4a3afe5-e12c-48c1-88a7-96c751cb96b9",
      "680997a4-4666-42dc-9526-0463ae3c8832",
    ];
    try {
      const provider: UseEvaluatorProvider = {
        evaluate: vi.fn(async (input) => ({
          output: {
            schema_version: "use-eval.v1",
            attempt_id: input.attemptId,
            verdict: "retry",
            dimensions: { meaning: "complete", target_expression: "used_with_error", grammar: "ok", collocation: "awkward" },
            errors: [{ type: "target_expression", severity: "blocking", span: null, message_zh: "目标搭配还不自然。" }],
            positive_evidence: [],
            minimal_hint: { kind: "preposition_cue", text_zh: "检查目标搭配中的介词。" },
            confidence: 0.94,
            needs_review: false,
          },
          provider: "fixture",
          model: "retry-fixture-v1",
          promptVersion: "use-evaluator-v11",
          schemaVersion: "use-eval.v1",
          inputTokens: 80,
          outputTokens: 40,
          latencyMs: 2,
        })),
      };

      const first = await evaluateCollocationUseAttempt({
        connection, attemptId: attempts[0]!, exerciseRef, learnerAnswer: "First draft.", provider,
      });
      const second = await evaluateCollocationUseAttempt({
        connection, attemptId: attempts[1]!, previousAttemptId: attempts[0], exerciseRef,
        learnerAnswer: "Second draft.", provider,
      });
      const third = await evaluateCollocationUseAttempt({
        connection, attemptId: attempts[2]!, previousAttemptId: attempts[1], exerciseRef,
        learnerAnswer: "Third draft.", provider,
      });

      expect(first).toMatchObject({ retryIndex: 0, teachingAction: { type: "GIVE_MINIMAL_HINT" } });
      expect(second).toMatchObject({ retryIndex: 1, teachingAction: { type: "RETRY" } });
      expect(third).toMatchObject({ retryIndex: 2, teachingAction: { type: "SHOW_REFERENCE" } });
      expect(connection.sqlite.prepare(
        "SELECT previous_attempt_id AS previousAttemptId, retry_index AS retryIndex, teaching_action_json AS teachingActionJson FROM use_evaluation_runs WHERE attempt_id = ?",
      ).get(attempts[2])).toMatchObject({ previousAttemptId: attempts[1], retryIndex: 2 });

      await expect(evaluateCollocationUseAttempt({
        connection,
        attemptId: "2bb4f35d-f87c-4c23-9171-e7f2a64edce5",
        previousAttemptId: attempts[2],
        exerciseRef,
        learnerAnswer: "A disallowed fourth draft.",
        provider,
      })).rejects.toMatchObject({ code: "RETRY_LIMIT_REACHED", statusCode: 409 });
    } finally {
      connection.close();
    }
  });

  it("records provider fallback and keeps the existing self-rated Use write idempotent", async () => {
    const { connection, collocation } = await seededConnection("fallback.db");
    try {
      const attemptId = "f73929a0-a128-46c0-9588-53f7a3b11fc4";
      const exerciseRef = buildCollocationUseExerciseRef(collocation);
      const answer = "A learner sentence that remains available for self-review.";
      const result = await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef,
        learnerAnswer: answer,
        provider: null,
      });
      expect(result.status).toBe("fallback");
      expect(connection.sqlite.prepare("SELECT status, error_code AS errorCode FROM use_evaluation_runs WHERE attempt_id = ?")
        .get(attemptId)).toEqual({ status: "fallback", errorCode: "PROVIDER_NOT_CONFIGURED" });

      const learning = new LearningRepository(connection);
      const input = {
        attemptId,
        exerciseType: "guided_application" as const,
        collocationId: collocation.id,
        promptSnapshot: collocation.exercise_seed.guided_application!.prompt_zh,
        userAnswer: answer,
        selfRating: "fuzzy" as const,
        hintUsed: true,
        durationMs: 2000,
        completedAt: "2026-08-19T09:00:00.000Z",
      };
      const first = learning.recordCollocationUse(input);
      const duplicate = learning.recordCollocationUse(input);
      expect(first.duplicate).toBe(false);
      expect(duplicate.duplicate).toBe(true);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM collocation_attempts WHERE id = ?").get(attemptId))
        .toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT success_streak AS streak FROM collocation_progress WHERE collocation_id = ?")
        .get(collocation.id)).toEqual({ streak: 0 });
      expect(() => learning.recordCollocationUse({ ...input, selfRating: "can_use" }))
        .toThrow(AttemptIdConflictError);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM collocation_attempts WHERE id = ?").get(attemptId))
        .toEqual({ count: 1 });
    } finally {
      connection.close();
    }
  });

  it("allows a provider retry with a new evaluation ID without consuming a learner retry", async () => {
    const { connection, collocation } = await seededConnection("provider-retry.db");
    const exerciseRef = buildCollocationUseExerciseRef(collocation);
    const answer = collocation.exercise_seed.guided_application!.reference_answer;
    try {
      const failed = await evaluateCollocationUseAttempt({
        connection,
        attemptId: "c9384d80-f130-41df-8d5e-a2a9c4bbbd5c",
        exerciseRef,
        learnerAnswer: answer,
        provider: null,
      });
      expect(failed).toMatchObject({ status: "fallback", retryIndex: 0, teachingAction: { type: "SHOW_REFERENCE" } });

      const provider: UseEvaluatorProvider = {
        evaluate: vi.fn(async (input) => ({
          output: {
            schema_version: "use-eval.v1",
            attempt_id: input.attemptId,
            verdict: "pass",
            dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
            errors: [],
            positive_evidence: [{ type: "target_expression", span: null, message_zh: "目标搭配使用自然。" }],
            minimal_hint: null,
            confidence: 0.96,
            needs_review: false,
          },
          provider: "fixture",
          model: "provider-retry-fixture-v1",
          promptVersion: "use-evaluator-v11",
          schemaVersion: "use-eval.v1",
          inputTokens: 90,
          outputTokens: 45,
          latencyMs: 3,
        })),
      };
      const retried = await evaluateCollocationUseAttempt({
        connection,
        attemptId: "632d1b96-d2cd-4503-9d74-d0352049e849",
        exerciseRef,
        learnerAnswer: answer,
        provider,
      });
      expect(retried).toMatchObject({ status: "evaluated", retryIndex: 0, teachingAction: { type: "PASS" } });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM use_evaluation_runs").get()).toEqual({ count: 2 });
    } finally {
      connection.close();
    }
  });

  it("keeps the existing sentence Use write idempotent with a stable attempt ID", async () => {
    const { connection } = await seededConnection("sentence-idempotent.db");
    try {
      const card = new ContentRepository(connection).listCards()[0]!;
      const learning = new LearningRepository(connection);
      const input = {
        attemptId: "967553a2-90a6-4877-b079-7a87d67fc85f",
        exerciseType: "guided_application" as const,
        cardId: String(card.id),
        promptSnapshot: "稳定的句子 Use 题目",
        userAnswer: "A stable learner answer.",
        selfRating: "recalled" as const,
        hintUsed: true,
        durationMs: 1500,
        completedAt: "2026-08-19T09:30:00.000Z",
      };
      const first = learning.recordUseAttempt(input);
      const duplicate = learning.recordUseAttempt(input);
      expect(first).toMatchObject({ duplicate: false, completedAt: input.completedAt });
      expect(duplicate).toMatchObject({ duplicate: true, completedAt: input.completedAt });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM attempts WHERE id = ?").get(input.attemptId))
        .toEqual({ count: 1 });
      expect(() => learning.recordUseAttempt({ ...input, userAnswer: "A different answer." }))
        .toThrow(AttemptIdConflictError);
    } finally {
      connection.close();
    }
  });

  it("evaluates reviewed Sentence Use structure and vocabulary tasks without changing learning progress", async () => {
    const { connection } = await seededConnection("sentence-evaluator.db");
    try {
      const cards = new ContentRepository(connection).listCards() as unknown as SentenceCardData[];
      const structureCard = cards.find((card) => card.content_status === "approved"
        && card.primary_focus !== "vocabulary"
        && Boolean(card.pattern && card.exercise_seed.slot_replacement?.[0]));
      const vocabularyCard = cards.find((card) => card.content_status === "approved"
        && card.primary_focus === "vocabulary"
        && Boolean(card.exercise_seed.guided_application));
      expect(structureCard).toBeDefined();
      expect(vocabularyCard).toBeDefined();

      const cases = [structureCard!, vocabularyCard!].map((card, index) => {
        const task = buildUseTask(card);
        return {
          card,
          task,
          attemptId: index === 0
            ? "10efb73f-c0bf-4493-a669-674dcc0c04b5"
            : "2893c213-6ea9-46b4-9229-d083ed47e133",
        };
      });
      const seenInputs: Array<Parameters<UseEvaluatorProvider["evaluate"]>[0]> = [];
      const provider: UseEvaluatorProvider = {
        evaluate: vi.fn(async (input) => {
          seenInputs.push(input);
          return {
            output: {
              schema_version: "use-eval.v1",
              attempt_id: input.attemptId,
              verdict: "pass",
              dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
              errors: [],
              positive_evidence: [{ type: "meaning", span: null, message_zh: "核心意思表达完整。" }],
              minimal_hint: null,
              confidence: 0.96,
              needs_review: false,
            },
            provider: "fixture",
            model: "sentence-fixture-v1",
            promptVersion: "use-evaluator-v11",
            schemaVersion: "use-eval.v1",
            inputTokens: 80,
            outputTokens: 40,
            latencyMs: 2,
          };
        }),
      };

      for (const item of cases) {
        const result = await evaluateUseAttempt({
          connection,
          attemptId: item.attemptId,
          exerciseRef: buildSentenceUseExerciseRef(item.card, item.task.exerciseType),
          learnerAnswer: item.task.referenceAnswer,
          provider,
        });
        expect(result).toMatchObject({ status: "evaluated", teachingAction: { type: "PASS" } });
      }

      expect(seenInputs).toHaveLength(2);
      expect(seenInputs[0]?.exercise).toMatchObject({
        exerciseType: "sentence_use",
        targetAsset: { type: "sentence_pattern" },
      });
      expect(seenInputs[0]?.exercise.targetAsset.canonicalText).toContain("{");
      expect(seenInputs[1]?.exercise).toMatchObject({
        exerciseType: "sentence_use",
        targetAsset: { type: "collocation" },
      });
      expect(seenInputs[1]?.exercise.targetAsset.canonicalText).not.toContain("{");
      expect(connection.sqlite.prepare(
        "SELECT exercise_kind AS exerciseKind, COUNT(*) AS count FROM use_evaluation_runs GROUP BY exercise_kind",
      ).all()).toEqual([{ exerciseKind: "sentence_use", count: 2 }]);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM attempts").get()).toEqual({ count: 0 });
    } finally {
      connection.close();
    }
  });

  it("falls back safely on malformed provider output", async () => {
    const { connection, collocation } = await seededConnection("invalid-output.db");
    try {
      const attemptId = "8292c9a0-1ddc-4dd3-93a4-aa1394ecfb84";
      const provider = {
        evaluate: vi.fn(async () => ({
          output: { schema_version: "use-eval.v1", attempt_id: attemptId },
          provider: "fixture",
          model: "invalid-fixture-v1",
          promptVersion: "use-evaluator-v11",
          schemaVersion: "use-eval.v1",
          inputTokens: 10,
          outputTokens: 5,
          latencyMs: 1,
        })),
      } satisfies UseEvaluatorProvider;
      const result = await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: "This answer is preserved when validation fails.",
        provider,
      });
      expect(result.status).toBe("fallback");
      expect(connection.sqlite.prepare("SELECT status FROM use_evaluation_runs WHERE attempt_id = ?").get(attemptId))
        .toEqual({ status: "invalid_output" });
    } finally {
      connection.close();
    }
  });

  it("aborts a slow provider and records a timeout fallback", async () => {
    const { connection, collocation } = await seededConnection("timeout.db");
    try {
      const attemptId = "5cd61794-448e-49b1-ab69-c5cbb2a44c80";
      const provider: UseEvaluatorProvider = {
        evaluate: vi.fn((_input, signal) => new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        })),
      };
      const result = await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: "This answer is preserved when the provider times out.",
        provider,
        timeoutMs: 5,
      });
      expect(result.status).toBe("fallback");
      expect(connection.sqlite.prepare("SELECT status, error_code AS errorCode FROM use_evaluation_runs WHERE attempt_id = ?")
        .get(attemptId)).toEqual({ status: "timeout", errorCode: "PROVIDER_TIMEOUT" });
      const run = new UseEvaluationRepository(connection).get(attemptId)!;
      expect(new UseEvaluationRepository(connection).getTrace(run.traceId)?.steps.map((item) => item.kind))
        .toEqual(["db_read", "model_call", "db_write"]);
    } finally {
      connection.close();
    }
  });

  it("backs up and restores evaluations, teaching actions, safe traces, and learning evidence with schema v1.6", async () => {
    const { connection, collocation } = await seededConnection("backup-source.db");
    const attemptId = "73d10fca-8d7c-4d51-913a-c1deba4a4bc2";
    try {
      await evaluateCollocationUseAttempt({
        connection,
        attemptId,
        exerciseRef: buildCollocationUseExerciseRef(collocation),
        learnerAnswer: "",
        provider: null,
      });
      const backup = exportFullBackup(connection);
      expect(backup.schema_version).toBe("1.11.0");
      expect(backup.agent_traces).toHaveLength(1);
      expect(backup.use_evaluation_runs).toHaveLength(1);
      expect(backup.use_evaluation_runs?.[0]).toMatchObject({ retry_index: 0, previous_attempt_id: null });
      expect(backup.use_evaluation_runs?.[0]?.teaching_action_json).toContain("GIVE_MINIMAL_HINT");

      const restored = openDatabase(path.join(temporaryDirectory, "backup-restored.db"));
      try {
        migrateDatabase(restored);
        await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback") });
        expect(restored.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces").get()).toEqual({ count: 1 });
        expect(restored.sqlite.prepare("SELECT COUNT(*) AS count FROM use_evaluation_runs").get()).toEqual({ count: 1 });
        expect(restored.sqlite.prepare("SELECT retry_index AS retryIndex, teaching_action_json AS teachingActionJson FROM use_evaluation_runs").get())
          .toMatchObject({ retryIndex: 0 });
      } finally {
        restored.close();
      }

      const {
        payload_hash: _hash,
        learning_evidence: _learningEvidence,
        adaptive_training_decisions: _adaptiveTrainingDecisions,
        adaptive_retests: _adaptiveRetests,
        guided_writing_sessions: _guidedWritingSessions,
        guided_writing_turns: _guidedWritingTurns,
        guided_writing_paragraph_drafts: _guidedWritingParagraphDrafts,
        ...currentPayload
      } = backup;
      const legacyPayload = {
        ...currentPayload,
        schema_version: "1.2.0" as const,
        use_evaluation_runs: backup.use_evaluation_runs?.map((run) => {
          const {
            previous_attempt_id: _previous,
            retry_index: _retry,
            teaching_action_json: _action,
            ...legacyRun
          } = run;
          return legacyRun;
        }),
      };
      const legacyBackup = { ...legacyPayload, payload_hash: sha256(legacyPayload) } as FullBackup;
      const legacyRestored = openDatabase(path.join(temporaryDirectory, "backup-v1.2-restored.db"));
      try {
        migrateDatabase(legacyRestored);
        await restoreFullBackup(legacyRestored, legacyBackup, {
          rollbackDirectory: path.join(temporaryDirectory, "legacy-rollback"),
        });
        expect(legacyRestored.sqlite.prepare(
          "SELECT previous_attempt_id AS previousAttemptId, retry_index AS retryIndex, teaching_action_json AS teachingActionJson FROM use_evaluation_runs",
        ).get()).toEqual({ previousAttemptId: null, retryIndex: 0, teachingActionJson: null });
      } finally {
        legacyRestored.close();
      }
    } finally {
      connection.close();
    }
  });
});
