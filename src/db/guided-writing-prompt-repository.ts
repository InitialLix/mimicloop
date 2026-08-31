import { randomUUID } from "node:crypto";
import type { ImportedTask2PromptAnalysisV1 } from "../domain/writing/imported-task2-prompt";
import type { SqliteConnection } from "./client";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";

export type StoredTask2PromptAnalysis = {
  id: string; learnerId: string; promptText: string; promptHash: string; status: TraceStatus;
  analysis: ImportedTask2PromptAnalysisV1 | null; traceId: string; model: string | null;
  errorCode: string | null; createdAt: string; completedAt: string | null;
};

export class GuidedWritingPromptRepository {
  constructor(private readonly connection: SqliteConnection) {}

  get(id: string): StoredTask2PromptAnalysis | null {
    const row = this.connection.sqlite.prepare(
      `SELECT a.id, a.learner_id learnerId, a.prompt_text promptText, a.prompt_hash promptHash,
              a.status, a.analysis_json analysisJson, a.trace_id traceId, a.error_code errorCode,
              a.created_at createdAt, a.completed_at completedAt, t.model
       FROM guided_writing_prompt_analyses a JOIN agent_traces t ON t.id = a.trace_id WHERE a.id = ?`,
    ).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return { ...(row as unknown as Omit<StoredTask2PromptAnalysis, "analysis">), analysis: row.analysisJson ? JSON.parse(String(row.analysisJson)) as ImportedTask2PromptAnalysisV1 : null };
  }

  begin(input: { id: string; learnerId: string; learnerIdHash: string; promptText: string; promptHash: string; provider: string | null; model: string | null; promptVersion: string; schemaVersion: string; startedAt: string }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.get(input.id);
      if (existing) {
        if (existing.promptHash !== input.promptHash) throw new Error("Prompt analysis ID was already used with different input");
        return { created: false as const, analysis: existing };
      }
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens, error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'guided_writing_task2_prompt_analysis', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(traceId, input.learnerIdHash, input.startedAt, input.provider, input.model, input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt);
      this.connection.sqlite.prepare(
        `INSERT INTO guided_writing_prompt_analyses
         (id, learner_id, prompt_text, prompt_hash, status, analysis_json, trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', NULL, ?, NULL, ?, NULL, ?)`,
      ).run(input.id, input.learnerId, input.promptText, input.promptHash, traceId, input.startedAt, input.startedAt);
      return { created: true as const, analysis: this.get(input.id)! };
    })();
  }

  finalize(input: { id: string; status: TraceStatus; analysis: ImportedTask2PromptAnalysisV1 | null; errorCode: string | null; steps: TraceStep[]; provider?: string | null; model?: string | null; inputTokens?: number | null; outputTokens?: number | null; completedAt: string }) {
    this.connection.sqlite.transaction(() => {
      const stored = this.get(input.id); if (!stored) throw new Error(`Unknown prompt analysis: ${input.id}`);
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_prompt_analyses SET status = ?, analysis_json = ?, error_code = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      ).run(input.status, input.analysis ? JSON.stringify(input.analysis) : null, input.errorCode, input.completedAt, input.completedAt, input.id);
      this.connection.sqlite.prepare(
        `UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?, provider = COALESCE(?, provider), model = COALESCE(?, model),
          input_tokens = ?, output_tokens = ?, error_codes_json = ?, updated_at = ? WHERE id = ?`,
      ).run(input.status, input.completedAt, JSON.stringify(input.steps), input.provider ?? null, input.model ?? null, input.inputTokens ?? null, input.outputTokens ?? null, JSON.stringify(input.errorCode ? [input.errorCode] : []), input.completedAt, stored.traceId);
    })();
    return this.get(input.id)!;
  }
}
