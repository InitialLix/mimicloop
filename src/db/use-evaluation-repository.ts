import { randomUUID } from "node:crypto";
import type { UseEvaluationFeedback, UseEvaluationV1 } from "../domain/practice/use-evaluation";
import type { TeachingActionV1 } from "../domain/practice/teaching-action";
import type { SqliteConnection } from "./client";

export type TraceStatus = "success" | "fallback" | "invalid_output" | "timeout" | "error";

export type TraceStep = {
  name: string;
  kind: "db_read" | "model_call" | "validation" | "policy" | "db_write";
  startedAt: string;
  durationMs: number;
  outcome: string;
  inputRefs?: string[];
  outputRefs?: string[];
  errorCodes?: string[];
};

export type StoredUseEvaluationRun = {
  attemptId: string;
  exerciseRef: string;
  exerciseKind: "collocation_use" | "sentence_use";
  assetId: string;
  assetRevision: number;
  inputHash: string;
  learnerAnswer: string;
  previousAttemptId: string | null;
  retryIndex: number;
  status: "pending" | TraceStatus;
  evaluation: UseEvaluationV1 | null;
  feedback: UseEvaluationFeedback | null;
  teachingAction: TeachingActionV1 | null;
  traceId: string;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type StoredAgentTrace = {
  id: string;
  learnerIdHash: string;
  feature: "use_evaluator";
  status: "pending" | TraceStatus;
  startedAt: string;
  completedAt: string | null;
  steps: TraceStep[];
  provider: string | null;
  model: string | null;
  promptVersion: string;
  schemaVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  errorCodes: string[];
};

export class IdempotencyConflictError extends Error {}

function parseJson<T>(value: string | null): T | null {
  return value ? JSON.parse(value) as T : null;
}

export class UseEvaluationRepository {
  constructor(private readonly connection: SqliteConnection) {}

  begin(input: {
    attemptId: string;
    exerciseRef: string;
    exerciseKind: StoredUseEvaluationRun["exerciseKind"];
    assetId: string;
    assetRevision: number;
    inputHash: string;
    learnerAnswer: string;
    previousAttemptId: string | null;
    retryIndex: number;
    learnerIdHash: string;
    promptVersion: string;
    schemaVersion: string;
    provider: string | null;
    model: string | null;
    startedAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.get(input.attemptId);
      if (existing) {
        if (existing.exerciseRef !== input.exerciseRef || existing.inputHash !== input.inputHash) {
          throw new IdempotencyConflictError("Attempt ID was already used with different input");
        }
        return { created: false as const, run: existing };
      }
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'use_evaluator', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId,
        input.learnerIdHash,
        input.startedAt,
        input.provider,
        input.model,
        input.promptVersion,
        input.schemaVersion,
        input.startedAt,
        input.startedAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO use_evaluation_runs
         (attempt_id, exercise_ref, exercise_kind, asset_id, asset_revision, input_hash,
          learner_answer, previous_attempt_id, retry_index, status, evaluation_json, feedback_json,
          teaching_action_json, trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, NULL, ?, NULL, ?)`,
      ).run(
        input.attemptId,
        input.exerciseRef,
        input.exerciseKind,
        input.assetId,
        input.assetRevision,
        input.inputHash,
        input.learnerAnswer,
        input.previousAttemptId,
        input.retryIndex,
        traceId,
        input.startedAt,
        input.startedAt,
      );
      return { created: true as const, run: this.get(input.attemptId)! };
    })();
  }

  get(attemptId: string): StoredUseEvaluationRun | null {
    const row = this.connection.sqlite.prepare(
      `SELECT attempt_id AS attemptId, exercise_ref AS exerciseRef, exercise_kind AS exerciseKind,
              asset_id AS assetId, asset_revision AS assetRevision, input_hash AS inputHash,
              learner_answer AS learnerAnswer, previous_attempt_id AS previousAttemptId,
              retry_index AS retryIndex, status, evaluation_json AS evaluationJson,
              feedback_json AS feedbackJson, teaching_action_json AS teachingActionJson,
              trace_id AS traceId, error_code AS errorCode,
              created_at AS createdAt, completed_at AS completedAt
       FROM use_evaluation_runs WHERE attempt_id = ?`,
    ).get(attemptId) as (Omit<StoredUseEvaluationRun, "evaluation" | "feedback" | "teachingAction"> & {
      evaluationJson: string | null;
      feedbackJson: string | null;
      teachingActionJson: string | null;
    }) | undefined;
    if (!row) return null;
    const { evaluationJson, feedbackJson, teachingActionJson, ...rest } = row;
    return {
      ...rest,
      evaluation: parseJson<UseEvaluationV1>(evaluationJson),
      feedback: parseJson<UseEvaluationFeedback>(feedbackJson),
      teachingAction: parseJson<TeachingActionV1>(teachingActionJson),
    };
  }

  getTrace(traceId: string): StoredAgentTrace | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id_hash AS learnerIdHash, feature, status,
              started_at AS startedAt, completed_at AS completedAt, steps_json AS stepsJson,
              provider, model, prompt_version AS promptVersion, schema_version AS schemaVersion,
              input_tokens AS inputTokens, output_tokens AS outputTokens,
              error_codes_json AS errorCodesJson
       FROM agent_traces WHERE id = ?`,
    ).get(traceId) as (Omit<StoredAgentTrace, "steps" | "errorCodes"> & {
      stepsJson: string;
      errorCodesJson: string;
    }) | undefined;
    if (!row) return null;
    const { stepsJson, errorCodesJson, ...rest } = row;
    return {
      ...rest,
      steps: JSON.parse(stepsJson) as TraceStep[],
      errorCodes: JSON.parse(errorCodesJson) as string[],
    };
  }

  finalize(input: {
    attemptId: string;
    status: TraceStatus;
    evaluation?: UseEvaluationV1 | null;
    feedback?: UseEvaluationFeedback | null;
    teachingAction: TeachingActionV1;
    errorCode?: string | null;
    steps: TraceStep[];
    provider?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    completedAt: string;
  }) {
    this.connection.sqlite.transaction(() => {
      const current = this.get(input.attemptId);
      if (!current) throw new Error(`Unknown evaluation attempt: ${input.attemptId}`);
      this.connection.sqlite.prepare(
        `UPDATE use_evaluation_runs SET status = ?, evaluation_json = ?, feedback_json = ?,
           teaching_action_json = ?, error_code = ?, completed_at = ?, updated_at = ? WHERE attempt_id = ?`,
      ).run(
        input.status,
        input.evaluation ? JSON.stringify(input.evaluation) : null,
        input.feedback ? JSON.stringify(input.feedback) : null,
        JSON.stringify(input.teachingAction),
        input.errorCode ?? null,
        input.completedAt,
        input.completedAt,
        input.attemptId,
      );
      this.connection.sqlite.prepare(
        `UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?, provider = COALESCE(?, provider),
           model = COALESCE(?, model), input_tokens = ?, output_tokens = ?, error_codes_json = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        input.status,
        input.completedAt,
        JSON.stringify(input.steps),
        input.provider ?? null,
        input.model ?? null,
        input.inputTokens ?? null,
        input.outputTokens ?? null,
        JSON.stringify(input.errorCode ? [input.errorCode] : []),
        input.completedAt,
        current.traceId,
      );
    })();
    return this.get(input.attemptId)!;
  }
}
