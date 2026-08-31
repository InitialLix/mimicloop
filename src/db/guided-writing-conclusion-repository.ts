import { randomUUID } from "node:crypto";
import type { GuidedWritingConclusionDraftView, GuidedWritingConclusionEvaluationV1 } from "../domain/writing/conclusion-evaluation";
import type { SqliteConnection } from "./client";
import { GuidedWritingConflictError } from "./guided-writing-repository";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";

type StoredDraft = Omit<GuidedWritingConclusionDraftView, "model"> & { learnerId: string; inputHash: string; traceId: string };
export class GuidedWritingConclusionRepository {
  constructor(private readonly connection: SqliteConnection) {}
  getDraft(id: string): StoredDraft | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id learnerId, source_essay_id sourceEssayId, introduction_draft_id introductionDraftId,
              body_1_draft_id bodyOneDraftId, body_2_draft_id bodyTwoDraftId, conclusion_text conclusionText,
              input_hash inputHash, status, evaluation_json evaluationJson, trace_id traceId, error_code errorCode,
              created_at createdAt, completed_at completedAt FROM guided_writing_conclusion_drafts WHERE id = ?`,
    ).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...(row as unknown as StoredDraft), evaluation: row.evaluationJson ? JSON.parse(String(row.evaluationJson)) as GuidedWritingConclusionEvaluationV1 : null };
  }
  view(id: string): GuidedWritingConclusionDraftView | null {
    const draft = this.getDraft(id); if (!draft) return null;
    const trace = this.connection.sqlite.prepare("SELECT model FROM agent_traces WHERE id = ?").get(draft.traceId) as { model: string | null } | undefined;
    const { learnerId: _learnerId, inputHash: _inputHash, traceId: _traceId, ...view } = draft;
    return { ...view, model: trace?.model ?? null };
  }
  latestForSource(learnerId: string, sourceEssayId: string) {
    const row = this.connection.sqlite.prepare(`SELECT id FROM guided_writing_conclusion_drafts WHERE learner_id = ? AND source_essay_id = ? ORDER BY created_at DESC, id DESC LIMIT 1`).get(learnerId, sourceEssayId) as { id: string } | undefined;
    return row ? this.view(row.id) : null;
  }
  beginDraft(input: { id: string; learnerId: string; learnerIdHash: string; sourceEssayId: string; introductionDraftId: string; bodyOneDraftId: string; bodyTwoDraftId: string; conclusionText: string; inputHash: string; provider: string | null; model: string | null; promptVersion: string; schemaVersion: string; startedAt: string }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getDraft(input.id);
      if (existing) {
        if (existing.sourceEssayId !== input.sourceEssayId || existing.inputHash !== input.inputHash) throw new GuidedWritingConflictError("Conclusion draft ID was already used with different input");
        return { created: false as const, draft: this.view(existing.id)! };
      }
      const pending = this.connection.sqlite.prepare(`SELECT id FROM guided_writing_conclusion_drafts WHERE learner_id = ? AND source_essay_id = ? AND status = 'pending' LIMIT 1`).get(input.learnerId, input.sourceEssayId);
      if (pending) throw new GuidedWritingConflictError("Wait for the current conclusion check to finish");
      const traceId = randomUUID();
      this.connection.sqlite.prepare(`INSERT INTO agent_traces (id, learner_id_hash, feature, status, started_at, completed_at, steps_json, provider, model, prompt_version, schema_version, input_tokens, output_tokens, error_codes_json, created_at, updated_at) VALUES (?, ?, 'guided_writing_conclusion', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`).run(traceId, input.learnerIdHash, input.startedAt, input.provider, input.model, input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt);
      this.connection.sqlite.prepare(`INSERT INTO guided_writing_conclusion_drafts (id, learner_id, source_essay_id, introduction_draft_id, body_1_draft_id, body_2_draft_id, conclusion_text, input_hash, status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, NULL, ?, NULL, ?)`).run(input.id, input.learnerId, input.sourceEssayId, input.introductionDraftId, input.bodyOneDraftId, input.bodyTwoDraftId, input.conclusionText, input.inputHash, traceId, input.startedAt, input.startedAt);
      return { created: true as const, draft: this.view(input.id)! };
    })();
  }
  finalizeDraft(input: { draftId: string; status: TraceStatus; evaluation: GuidedWritingConclusionEvaluationV1 | null; errorCode: string | null; steps: TraceStep[]; provider?: string | null; model?: string | null; inputTokens?: number | null; outputTokens?: number | null; completedAt: string }) {
    this.connection.sqlite.transaction(() => {
      const draft = this.getDraft(input.draftId); if (!draft) throw new Error(`Unknown conclusion draft: ${input.draftId}`);
      this.connection.sqlite.prepare(`UPDATE guided_writing_conclusion_drafts SET status = ?, evaluation_json = ?, error_code = ?, completed_at = ?, updated_at = ? WHERE id = ?`).run(input.status, input.evaluation ? JSON.stringify(input.evaluation) : null, input.errorCode, input.completedAt, input.completedAt, input.draftId);
      this.connection.sqlite.prepare(`UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?, provider = COALESCE(?, provider), model = COALESCE(?, model), input_tokens = ?, output_tokens = ?, error_codes_json = ?, updated_at = ? WHERE id = ?`).run(input.status, input.completedAt, JSON.stringify(input.steps), input.provider ?? null, input.model ?? null, input.inputTokens ?? null, input.outputTokens ?? null, JSON.stringify(input.errorCode ? [input.errorCode] : []), input.completedAt, draft.traceId);
    })();
    return this.view(input.draftId)!;
  }
}
