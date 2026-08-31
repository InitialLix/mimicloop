import { performance } from "node:perf_hooks";
import { ContentRepository } from "../db/content-repository";
import { GuidedWritingPromptRepository } from "../db/guided-writing-prompt-repository";
import { sha256, type JsonObject } from "../db/json";
import type { SqliteConnection } from "../db/client";
import type { TraceStatus, TraceStep } from "../db/use-evaluation-repository";
import {
  TASK2_PROMPT_ANALYSIS_PROMPT_VERSION,
  TASK2_PROMPT_ANALYSIS_SCHEMA_VERSION,
  normalizeTask2Prompt,
  validateImportedTask2PromptAnalysis,
  validateImportedTask2PromptRecord,
  type ConfirmedImportedTask2Prompt,
  type ImportedTask2PromptAnalysisResult,
  type ImportedTask2PromptRecord,
  type Task2Topic,
} from "../domain/writing/imported-task2-prompt";
import { analyzeEssayTask, type EssayQuestionType } from "../domain/writing/task-analysis";
import { getGuidedWritingConfig } from "./ai/config";
import { DeepSeekGuidedWritingCoach, GuidedWritingProviderHttpError, type GuidedWritingTask2PromptProvider } from "./ai/guided-writing-provider";
import { GuidedWritingRequestError } from "./guided-writing-service";

const LOCAL_LEARNER_ID = "local-default-learner";
function step(name: string, kind: TraceStep["kind"], startedAt: string, startedPerformance: number, outcome: string, errorCodes?: string[]): TraceStep {
  return { name, kind, startedAt, durationMs: Math.max(0, Math.round(performance.now() - startedPerformance)), outcome, ...(errorCodes?.length ? { errorCodes } : {}) };
}
function mappedError(error: unknown): { status: TraceStatus; code: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") return { status: "timeout", code: "MODEL_TIMEOUT" };
  if (error instanceof GuidedWritingProviderHttpError) return { status: "error", code: `PROVIDER_HTTP_${error.status}` };
  if (error instanceof SyntaxError) return { status: "invalid_output", code: "INVALID_PROVIDER_JSON" };
  if (error instanceof TypeError) return { status: "error", code: "PROVIDER_NETWORK_ERROR" };
  return { status: "error", code: "MODEL_ERROR" };
}
function ensurePrompt(value: string) {
  const prompt = normalizeTask2Prompt(value);
  if (prompt.length < 30) throw new GuidedWritingRequestError("请粘贴完整的 IELTS Task 2 题目。", 400, "PROMPT_TOO_SHORT");
  if (prompt.length > 2_000) throw new GuidedWritingRequestError("题目不能超过 2,000 个字符。", 400, "PROMPT_TOO_LONG");
  return prompt;
}

export async function analyzeImportedTask2Prompt(input: { connection: SqliteConnection; analysisId: string; prompt: string; provider?: GuidedWritingTask2PromptProvider; now?: () => Date }): Promise<ImportedTask2PromptAnalysisResult> {
  const now = input.now ?? (() => new Date());
  const prompt = ensurePrompt(input.prompt);
  const config = getGuidedWritingConfig();
  const repository = new GuidedWritingPromptRepository(input.connection);
  const startedAt = now().toISOString();
  const begun = repository.begin({ id: input.analysisId, learnerId: LOCAL_LEARNER_ID, learnerIdHash: sha256(LOCAL_LEARNER_ID), promptText: prompt, promptHash: sha256(prompt), provider: config.enabled ? config.provider : null, model: config.model, promptVersion: TASK2_PROMPT_ANALYSIS_PROMPT_VERSION, schemaVersion: TASK2_PROMPT_ANALYSIS_SCHEMA_VERSION, startedAt });
  if (!begun.created) return { analysisId: begun.analysis.id, prompt: begun.analysis.promptText, status: begun.analysis.analysis ? "evaluated" : "fallback", analysis: begun.analysis.analysis, model: begun.analysis.model, message: begun.analysis.errorCode ? "AI 识别暂时不可用，请手动确认题型和主题。" : null };
  const steps: TraceStep[] = [];
  const fallback = (status: TraceStatus, code: string): ImportedTask2PromptAnalysisResult => {
    const stored = repository.finalize({ id: input.analysisId, status, analysis: null, errorCode: code, steps, completedAt: now().toISOString() });
    return { analysisId: stored.id, prompt: stored.promptText, status: "fallback", analysis: null, model: stored.model, message: "AI 识别暂时不可用。题目已保留，你仍可手动选择题型和主题后继续。" };
  };
  if (!config.enabled || !config.apiKey || !config.model) return fallback("fallback", "GUIDED_WRITING_NOT_CONFIGURED");
  try {
    const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model });
    const callAt = now().toISOString(); const callStart = performance.now();
    const result = await provider.analyzeTask2Prompt({ analysisId: input.analysisId, prompt }, AbortSignal.timeout(config.timeoutMs));
    steps.push(step("analyze_task2_prompt", "model_call", callAt, callStart, "completed"));
    const validationAt = now().toISOString(); const validationStart = performance.now();
    const validation = validateImportedTask2PromptAnalysis(result.output, input.analysisId);
    steps.push(step("validate_task2_prompt_analysis", "validation", validationAt, validationStart, validation.valid ? "valid" : "invalid", validation.valid ? undefined : validation.errors));
    if (!validation.valid) return fallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
    const completed = repository.finalize({ id: input.analysisId, status: "success", analysis: validation.analysis, errorCode: null, steps, provider: result.provider, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, completedAt: now().toISOString() });
    return { analysisId: completed.id, prompt: completed.promptText, status: "evaluated", analysis: completed.analysis, model: completed.model, message: completed.analysis?.needs_review ? "这个题目的指令可能存在混合或歧义，请重点核对题型。" : null };
  } catch (error) {
    const mapped = mappedError(error); return fallback(mapped.status, mapped.code);
  }
}

export function confirmImportedTask2Prompt(input: { connection: SqliteConnection; analysisId: string; prompt: string; questionType: EssayQuestionType; topic: Task2Topic; now?: () => Date }): ConfirmedImportedTask2Prompt {
  const prompt = ensurePrompt(input.prompt);
  const analysis = new GuidedWritingPromptRepository(input.connection).get(input.analysisId);
  if (!analysis || analysis.promptHash !== sha256(prompt)) throw new GuidedWritingRequestError("这次题型确认与刚才分析的题目不一致，请重新识别。", 409, "PROMPT_ANALYSIS_MISMATCH");
  const contentHash = sha256(prompt);
  const repository = new ContentRepository(input.connection);
  const existing = (repository.listSources() as JsonObject[]).find((item) => item.content_role === "guided_writing_prompt" && item.content_hash === contentHash);
  if (existing) return { prompt: analyzeEssayTask(existing as never), created: false };
  const createdAt = (input.now ?? (() => new Date()))().toISOString();
  const titleSeed = prompt.replace(/\s+/g, " ").slice(0, 72).replace(/[.?!,:;]+$/u, "");
  const record: ImportedTask2PromptRecord = {
    schema_version: "1.0.0", record_kind: "guided_writing_prompt", id: crypto.randomUUID(),
    title: `我的新题 · ${titleSeed}${prompt.length > 72 ? "…" : ""}`, ielts_prompt: prompt,
    source_name: "Learner imported IELTS Task 2 prompt", content_role: "guided_writing_prompt",
    source_type: "manual_text", answer_origin: "user_authored", author: "Local learner",
    question_type: input.questionType, topics: [input.topic], content_hash: contentHash,
    analysis_id: input.analysisId, created_at: createdAt, updated_at: createdAt,
  };
  const valid = validateImportedTask2PromptRecord(record);
  if (!valid.valid) throw new GuidedWritingRequestError(valid.errors.join("; "), 400, "INVALID_IMPORTED_PROMPT");
  repository.saveGuidedWritingPrompt(record as unknown as JsonObject);
  return { prompt: analyzeEssayTask(record as never), created: true };
}
