import { randomUUID } from "node:crypto";
import type {
  GuidedWritingNodeLanguageAttemptView,
  GuidedWritingNodeLanguageEvaluationV1,
  NodeHintLevel,
} from "../domain/writing/node-language-activation";
import type { WritingLanguageNode } from "../domain/writing/learned-expression-retrieval";
import type { SqliteConnection } from "./client";
import { GuidedWritingConflictError } from "./guided-writing-repository";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";

type StoredAttempt = Omit<GuidedWritingNodeLanguageAttemptView, "model"> & {
  inputHash: string;
  traceId: string;
};

export class GuidedWritingNodeLanguageRepository {
  constructor(private readonly connection: SqliteConnection) {}

  getAttempt(id: string): StoredAttempt | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, session_id AS sessionId, node, learner_text AS learnerText,
              asset_type AS assetType, asset_id AS assetId, hint_level AS hintLevel,
              input_hash AS inputHash, status, evaluation_json AS evaluationJson,
              trace_id AS traceId, error_code AS errorCode, created_at AS createdAt,
              completed_at AS completedAt
       FROM guided_writing_node_language_attempts WHERE id = ?`,
    ).get(id) as (Omit<StoredAttempt, "evaluation"> & { evaluationJson: string | null }) | undefined;
    if (!row) return null;
    const { evaluationJson, ...rest } = row;
    return {
      ...rest,
      node: rest.node as WritingLanguageNode,
      hintLevel: rest.hintLevel as NodeHintLevel,
      assetType: rest.assetType as "sentence" | "collocation" | null,
      evaluation: evaluationJson ? JSON.parse(evaluationJson) as GuidedWritingNodeLanguageEvaluationV1 : null,
    };
  }

  view(id: string): GuidedWritingNodeLanguageAttemptView | null {
    const attempt = this.getAttempt(id);
    if (!attempt) return null;
    const trace = this.connection.sqlite.prepare("SELECT model FROM agent_traces WHERE id = ?")
      .get(attempt.traceId) as { model: string | null } | undefined;
    return { ...attempt, model: trace?.model ?? null };
  }

  latestForSession(sessionId: string): GuidedWritingNodeLanguageAttemptView[] {
    const rows = this.connection.sqlite.prepare(
      `SELECT id FROM guided_writing_node_language_attempts
       WHERE session_id = ? ORDER BY created_at, id`,
    ).all(sessionId) as Array<{ id: string }>;
    return rows.map((row) => this.view(row.id)!);
  }

  beginAttempt(input: {
    id: string;
    sessionId: string;
    node: WritingLanguageNode;
    learnerText: string;
    assetType: "sentence" | "collocation" | null;
    assetId: string | null;
    hintLevel: NodeHintLevel;
    inputHash: string;
    learnerIdHash: string;
    provider: string | null;
    model: string | null;
    promptVersion: string;
    schemaVersion: string;
    startedAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getAttempt(input.id);
      if (existing) {
        if (existing.sessionId !== input.sessionId || existing.inputHash !== input.inputHash) {
          throw new GuidedWritingConflictError("Node attempt ID was already used with different input");
        }
        return { created: false as const, attempt: this.view(existing.id)! };
      }
      const session = this.connection.sqlite.prepare(
        "SELECT status FROM guided_writing_sessions WHERE id = ?",
      ).get(input.sessionId) as { status: string } | undefined;
      if (!session) throw new GuidedWritingConflictError("This writing session no longer exists");
      if (session.status !== "ready_to_draft") throw new GuidedWritingConflictError("Complete the argument chain first");
      const pending = this.connection.sqlite.prepare(
        "SELECT id FROM guided_writing_node_language_attempts WHERE session_id = ? AND status = 'pending' LIMIT 1",
      ).get(input.sessionId) as { id: string } | undefined;
      if (pending) throw new GuidedWritingConflictError("Wait for the current node check to finish");
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'guided_writing_node_language', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId, input.learnerIdHash, input.startedAt, input.provider, input.model,
        input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO guided_writing_node_language_attempts
         (id, session_id, node, learner_text, asset_type, asset_id, hint_level, input_hash,
          status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, NULL, ?, NULL, ?)`,
      ).run(
        input.id, input.sessionId, input.node, input.learnerText, input.assetType, input.assetId,
        input.hintLevel, input.inputHash, traceId, input.startedAt, input.startedAt,
      );
      return { created: true as const, attempt: this.view(input.id)! };
    })();
  }

  finalizeAttempt(input: {
    attemptId: string;
    status: TraceStatus;
    evaluation: GuidedWritingNodeLanguageEvaluationV1 | null;
    errorCode: string | null;
    steps: TraceStep[];
    provider?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    completedAt: string;
  }) {
    this.connection.sqlite.transaction(() => {
      const attempt = this.getAttempt(input.attemptId);
      if (!attempt) throw new Error(`Unknown node language attempt: ${input.attemptId}`);
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_node_language_attempts
         SET status = ?, evaluation_json = ?, error_code = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        input.status, input.evaluation ? JSON.stringify(input.evaluation) : null, input.errorCode,
        input.completedAt, input.completedAt, input.attemptId,
      );
      this.connection.sqlite.prepare(
        `UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?,
         provider = COALESCE(?, provider), model = COALESCE(?, model), input_tokens = ?,
         output_tokens = ?, error_codes_json = ?, updated_at = ? WHERE id = ?`,
      ).run(
        input.status, input.completedAt, JSON.stringify(input.steps), input.provider ?? null,
        input.model ?? null, input.inputTokens ?? null, input.outputTokens ?? null,
        JSON.stringify(input.errorCode ? [input.errorCode] : []), input.completedAt, attempt.traceId,
      );
    })();
    return this.view(input.attemptId)!;
  }
}
