import { randomUUID } from "node:crypto";
import type {
  GuidedWritingIntroductionDraftView,
  GuidedWritingIntroductionEvaluationV1,
  IntroductionComponents,
} from "../domain/writing/introduction-evaluation";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";
import type { SqliteConnection } from "./client";
import { GuidedWritingConflictError } from "./guided-writing-repository";

type StoredDraft = Omit<GuidedWritingIntroductionDraftView, "model"> & {
  learnerId: string;
  inputHash: string;
  traceId: string;
};

export class GuidedWritingIntroductionRepository {
  constructor(private readonly connection: SqliteConnection) {}

  getDraft(id: string): StoredDraft | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, source_essay_id AS sourceEssayId,
              body_1_session_id AS bodyOneSessionId, body_2_session_id AS bodyTwoSessionId,
              opening_text AS openingText, task_framing_text AS taskFramingText,
              thesis_text AS thesisText, draft_text AS draftText, input_hash AS inputHash,
              status, evaluation_json AS evaluationJson, trace_id AS traceId,
              error_code AS errorCode, created_at AS createdAt, completed_at AS completedAt
       FROM guided_writing_introduction_drafts WHERE id = ?`,
    ).get(id) as {
      id: string;
      learnerId: string;
      sourceEssayId: string;
      bodyOneSessionId: string;
      bodyTwoSessionId: string;
      openingText: string;
      taskFramingText: string;
      thesisText: string;
      draftText: string;
      inputHash: string;
      status: StoredDraft["status"];
      evaluationJson: string | null;
      traceId: string;
      errorCode: string | null;
      createdAt: string;
      completedAt: string | null;
    } | undefined;
    if (!row) return null;
    return {
      id: row.id,
      learnerId: row.learnerId,
      sourceEssayId: row.sourceEssayId,
      bodyOneSessionId: row.bodyOneSessionId,
      bodyTwoSessionId: row.bodyTwoSessionId,
      components: {
        opening: row.openingText,
        taskFraming: row.taskFramingText,
        thesis: row.thesisText,
      },
      draftText: row.draftText,
      inputHash: row.inputHash,
      status: row.status,
      evaluation: row.evaluationJson ? JSON.parse(row.evaluationJson) as GuidedWritingIntroductionEvaluationV1 : null,
      traceId: row.traceId,
      errorCode: row.errorCode,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
  }

  view(id: string): GuidedWritingIntroductionDraftView | null {
    const draft = this.getDraft(id);
    if (!draft) return null;
    const trace = this.connection.sqlite.prepare("SELECT model FROM agent_traces WHERE id = ?")
      .get(draft.traceId) as { model: string | null } | undefined;
    return {
      id: draft.id,
      sourceEssayId: draft.sourceEssayId,
      bodyOneSessionId: draft.bodyOneSessionId,
      bodyTwoSessionId: draft.bodyTwoSessionId,
      components: draft.components,
      draftText: draft.draftText,
      status: draft.status,
      evaluation: draft.evaluation,
      model: trace?.model ?? null,
      errorCode: draft.errorCode,
      createdAt: draft.createdAt,
      completedAt: draft.completedAt,
    };
  }

  latestForSource(learnerId: string, sourceEssayId: string): GuidedWritingIntroductionDraftView | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id FROM guided_writing_introduction_drafts
       WHERE learner_id = ? AND source_essay_id = ?
       ORDER BY created_at DESC, id DESC LIMIT 1`,
    ).get(learnerId, sourceEssayId) as { id: string } | undefined;
    return row ? this.view(row.id) : null;
  }

  beginDraft(input: {
    id: string;
    learnerId: string;
    learnerIdHash: string;
    sourceEssayId: string;
    bodyOneSessionId: string;
    bodyTwoSessionId: string;
    components: IntroductionComponents;
    draftText: string;
    inputHash: string;
    provider: string | null;
    model: string | null;
    promptVersion: string;
    schemaVersion: string;
    startedAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getDraft(input.id);
      if (existing) {
        if (existing.sourceEssayId !== input.sourceEssayId || existing.inputHash !== input.inputHash) {
          throw new GuidedWritingConflictError("Introduction draft ID was already used with different input");
        }
        return { created: false as const, draft: this.view(existing.id)! };
      }
      const pending = this.connection.sqlite.prepare(
        `SELECT id FROM guided_writing_introduction_drafts
         WHERE learner_id = ? AND source_essay_id = ? AND status = 'pending' LIMIT 1`,
      ).get(input.learnerId, input.sourceEssayId) as { id: string } | undefined;
      if (pending) throw new GuidedWritingConflictError("Wait for the current introduction check to finish");
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'guided_writing_introduction', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId, input.learnerIdHash, input.startedAt, input.provider, input.model,
        input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO guided_writing_introduction_drafts
         (id, learner_id, source_essay_id, body_1_session_id, body_2_session_id,
          opening_text, task_framing_text, thesis_text, draft_text, input_hash,
          status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, NULL, ?, NULL, ?)`,
      ).run(
        input.id, input.learnerId, input.sourceEssayId, input.bodyOneSessionId, input.bodyTwoSessionId,
        input.components.opening, input.components.taskFraming, input.components.thesis,
        input.draftText, input.inputHash, traceId, input.startedAt, input.startedAt,
      );
      return { created: true as const, draft: this.view(input.id)! };
    })();
  }

  finalizeDraft(input: {
    draftId: string;
    status: TraceStatus;
    evaluation: GuidedWritingIntroductionEvaluationV1 | null;
    errorCode: string | null;
    steps: TraceStep[];
    provider?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    completedAt: string;
  }): GuidedWritingIntroductionDraftView {
    this.connection.sqlite.transaction(() => {
      const draft = this.getDraft(input.draftId);
      if (!draft) throw new Error(`Unknown Guided Writing introduction draft: ${input.draftId}`);
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_introduction_drafts
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
