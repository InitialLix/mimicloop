import { randomUUID } from "node:crypto";
import type {
  GuidedWritingParagraphDraftView,
  GuidedWritingParagraphEvaluationV1,
} from "../domain/writing/paragraph-evaluation";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";
import type { SqliteConnection } from "./client";
import { GuidedWritingConflictError } from "./guided-writing-repository";

type StoredDraft = Omit<GuidedWritingParagraphDraftView, "model"> & {
  inputHash: string;
  traceId: string;
};

export class GuidedWritingParagraphRepository {
  constructor(private readonly connection: SqliteConnection) {}

  getDraft(id: string): StoredDraft | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, session_id AS sessionId, paragraph_key AS paragraphKey,
              draft_text AS draftText, input_hash AS inputHash, status,
              evaluation_json AS evaluationJson, trace_id AS traceId,
              error_code AS errorCode, created_at AS createdAt, completed_at AS completedAt
       FROM guided_writing_paragraph_drafts WHERE id = ?`,
    ).get(id) as (Omit<StoredDraft, "evaluation"> & { evaluationJson: string | null }) | undefined;
    if (!row) return null;
    const { evaluationJson, ...rest } = row;
    return {
      ...rest,
      evaluation: evaluationJson ? JSON.parse(evaluationJson) as GuidedWritingParagraphEvaluationV1 : null,
    };
  }

  view(id: string): GuidedWritingParagraphDraftView | null {
    const draft = this.getDraft(id);
    if (!draft) return null;
    const trace = this.connection.sqlite.prepare("SELECT model FROM agent_traces WHERE id = ?")
      .get(draft.traceId) as { model: string | null } | undefined;
    return {
      id: draft.id,
      sessionId: draft.sessionId,
      paragraphKey: draft.paragraphKey,
      draftText: draft.draftText,
      status: draft.status,
      evaluation: draft.evaluation,
      model: trace?.model ?? null,
      errorCode: draft.errorCode,
      createdAt: draft.createdAt,
      completedAt: draft.completedAt,
    };
  }

  latestForSession(sessionId: string): GuidedWritingParagraphDraftView | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id FROM guided_writing_paragraph_drafts
       WHERE session_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`,
    ).get(sessionId) as { id: string } | undefined;
    return row ? this.view(row.id) : null;
  }

  beginDraft(input: {
    id: string;
    sessionId: string;
    inputHash: string;
    draftText: string;
    learnerIdHash: string;
    provider: string | null;
    model: string | null;
    promptVersion: string;
    schemaVersion: string;
    startedAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getDraft(input.id);
      if (existing) {
        if (existing.sessionId !== input.sessionId || existing.inputHash !== input.inputHash) {
          throw new GuidedWritingConflictError("Draft ID was already used with different input");
        }
        return { created: false as const, draft: this.view(existing.id)! };
      }
      const session = this.connection.sqlite.prepare(
        "SELECT status, paragraph_key AS paragraphKey FROM guided_writing_sessions WHERE id = ?",
      ).get(input.sessionId) as { status: string; paragraphKey: GuidedWritingParagraphDraftView["paragraphKey"] } | undefined;
      if (!session) throw new GuidedWritingConflictError("This writing session no longer exists");
      if (session.status !== "ready_to_draft") {
        throw new GuidedWritingConflictError("Complete and review the argument chain before drafting the paragraph");
      }
      const pending = this.connection.sqlite.prepare(
        "SELECT id FROM guided_writing_paragraph_drafts WHERE session_id = ? AND status = 'pending' LIMIT 1",
      ).get(input.sessionId) as { id: string } | undefined;
      if (pending) throw new GuidedWritingConflictError("Wait for the current paragraph check to finish");
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'guided_writing_paragraph', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId, input.learnerIdHash, input.startedAt, input.provider, input.model,
        input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO guided_writing_paragraph_drafts
         (id, session_id, paragraph_key, draft_text, input_hash, status, evaluation_json,
          trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, NULL, ?, NULL, ?)`,
      ).run(input.id, input.sessionId, session.paragraphKey, input.draftText, input.inputHash, traceId, input.startedAt, input.startedAt);
      return { created: true as const, draft: this.view(input.id)! };
    })();
  }

  finalizeDraft(input: {
    draftId: string;
    status: TraceStatus;
    evaluation: GuidedWritingParagraphEvaluationV1 | null;
    errorCode: string | null;
    steps: TraceStep[];
    provider?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    completedAt: string;
  }): GuidedWritingParagraphDraftView {
    this.connection.sqlite.transaction(() => {
      const draft = this.getDraft(input.draftId);
      if (!draft) throw new Error(`Unknown Guided Writing paragraph draft: ${input.draftId}`);
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_paragraph_drafts
         SET status = ?, evaluation_json = ?, error_code = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        input.status,
        input.evaluation ? JSON.stringify(input.evaluation) : null,
        input.errorCode,
        input.completedAt,
        input.completedAt,
        input.draftId,
      );
      this.connection.sqlite.prepare(
        `UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?,
         provider = COALESCE(?, provider), model = COALESCE(?, model), input_tokens = ?,
         output_tokens = ?, error_codes_json = ?, updated_at = ? WHERE id = ?`,
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
        draft.traceId,
      );
    })();
    return this.view(input.draftId)!;
  }
}
