import { sha256 } from "../db/json";
import type { SqliteConnection } from "../db/client";
import { ContentRepository } from "../db/content-repository";
import { GuidedWritingRepository } from "../db/guided-writing-repository";
import { GuidedWritingParagraphRepository } from "../db/guided-writing-paragraph-repository";
import { GuidedWritingIntroductionRepository } from "../db/guided-writing-introduction-repository";
import { GuidedWritingConclusionRepository } from "../db/guided-writing-conclusion-repository";
import { GuidedWritingFullEssayRepository } from "../db/guided-writing-full-essay-repository";
import type { TraceStatus, TraceStep } from "../db/use-evaluation-repository";
import {
  GUIDED_WRITING_CONCLUSION_PROMPT_VERSION, GUIDED_WRITING_CONCLUSION_SCHEMA_VERSION,
  conclusionNextAction, validateGuidedWritingConclusionEvaluation,
  type GuidedWritingConclusionContext, type GuidedWritingConclusionInputV1, type GuidedWritingConclusionNextAction,
} from "../domain/writing/conclusion-evaluation";
import {
  GUIDED_WRITING_FULL_ESSAY_PROMPT_VERSION, GUIDED_WRITING_FULL_ESSAY_SCHEMA_VERSION,
  fullEssayNextAction, validateGuidedWritingFullEssayEvaluation,
  type CorpusUseItem, type GuidedWritingFullEssayContext, type GuidedWritingFullEssayInputV1, type GuidedWritingFullEssayNextAction,
} from "../domain/writing/full-essay-evaluation";
import { analyzeEssayTask } from "../domain/writing/task-analysis";
import type { SourceEssayData, SentenceCardData, CollocationData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import { DeepSeekGuidedWritingCoach, GuidedWritingProviderHttpError, type GuidedWritingConclusionProvider, type GuidedWritingFullEssayProvider } from "./ai/guided-writing-provider";
import { GuidedWritingRequestError } from "./guided-writing-service";

const LEARNER_ID = "local-default-learner";
function mappedError(error: unknown): { status: TraceStatus; code: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") return { status: "timeout", code: "MODEL_TIMEOUT" };
  if (error instanceof GuidedWritingProviderHttpError) return { status: "error", code: `PROVIDER_HTTP_${error.status}` };
  if (error instanceof SyntaxError) return { status: "invalid_output", code: "INVALID_PROVIDER_JSON" };
  if (error instanceof TypeError) return { status: "error", code: "PROVIDER_NETWORK_ERROR" };
  return { status: "error", code: "MODEL_ERROR" };
}
function step(name: string, startedAt: string, started: number, outcome: string, errorCodes?: string[]): TraceStep { return { name, kind: name.startsWith("validate") ? "validation" : "model_call", startedAt, durationMs: Math.max(0, Math.round(performance.now() - started)), outcome, ...(errorCodes ? { errorCodes } : {}) }; }
function fallbackMessage(kind: "conclusion" | "essay") { return kind === "conclusion" ? "AI feedback is temporarily unavailable. Your conclusion has been saved and remains editable." : "AI final feedback is temporarily unavailable. Your four saved sections remain assembled and retryable."; }
function trustedAnalysis(connection: SqliteConnection, sourceEssayId: string) {
  const source = (new ContentRepository(connection).listSources() as unknown as SourceEssayData[]).find((item) => item.id === sourceEssayId && item.content_role !== "language_richness_corpus");
  if (!source?.ielts_prompt) throw new GuidedWritingRequestError("找不到这道已归档 IELTS 题目。", 404, "SOURCE_NOT_FOUND");
  return analyzeEssayTask(source);
}
function isClearParagraph(draft: ReturnType<GuidedWritingParagraphRepository["latestForSession"]>) { return draft?.status === "success" && draft.evaluation?.logic.status === "clear" && draft.evaluation.language.status === "clear"; }
function isClearIntroduction(draft: ReturnType<GuidedWritingIntroductionRepository["latestForSource"]>) { return draft?.status === "success" && draft.evaluation?.task_response.status === "clear" && draft.evaluation.language.status === "clear"; }
function loadBase(connection: SqliteConnection, sourceEssayId: string) {
  const analysis = trustedAnalysis(connection, sourceEssayId); const sessions = new GuidedWritingRepository(connection); const paragraphs = new GuidedWritingParagraphRepository(connection);
  const bodyOne = sessions.getLatestActive(LEARNER_ID, sourceEssayId, "body_1"); const bodyTwo = sessions.getLatestActive(LEARNER_ID, sourceEssayId, "body_2");
  if (!bodyOne || !bodyTwo) throw new GuidedWritingRequestError("Complete both body paragraphs first.", 409, "BODY_PARAGRAPHS_NOT_READY");
  const bodyOneDraft = paragraphs.latestForSession(bodyOne.id); const bodyTwoDraft = paragraphs.latestForSession(bodyTwo.id);
  if (!isClearParagraph(bodyOneDraft) || !isClearParagraph(bodyTwoDraft)) throw new GuidedWritingRequestError("Both body paragraphs need clear Logic and Language feedback first.", 409, "BODY_PARAGRAPHS_NOT_CLEAR");
  const intro = new GuidedWritingIntroductionRepository(connection).latestForSource(LEARNER_ID, sourceEssayId);
  if (!isClearIntroduction(intro)) throw new GuidedWritingRequestError("Complete a clear Introduction before writing the Conclusion.", 409, "INTRODUCTION_NOT_CLEAR");
  const position = bodyOne.graph.stance?.content?.trim(); if (!position) throw new GuidedWritingRequestError("The saved essay position is incomplete.", 409, "ESSAY_POSITION_INCOMPLETE");
  const roles = ["body_1", "body_2"].map((key) => analysis.outline.find((item) => item.key === key)?.role);
  if (!roles[0] || !roles[1]) throw new GuidedWritingRequestError("This prompt does not have a trusted two-paragraph plan.", 409, "ESSAY_PLAN_UNAVAILABLE");
  return { analysis, intro: intro!, bodyOne, bodyTwo, bodyOneDraft: bodyOneDraft!, bodyTwoDraft: bodyTwoDraft!, position,
    bodyPlan: [
      { key: "body_1" as const, role: roles[0], mainPoint: bodyOne.graph.claim?.content?.trim() ?? "", takeaway: bodyOne.graph.result?.content?.trim() ?? "", paragraphText: bodyOneDraft!.draftText },
      { key: "body_2" as const, role: roles[1], mainPoint: bodyTwo.graph.claim?.content?.trim() ?? "", takeaway: bodyTwo.graph.result?.content?.trim() ?? "", paragraphText: bodyTwoDraft!.draftText },
    ] };
}
function conclusionContext(base: ReturnType<typeof loadBase>): GuidedWritingConclusionContext { return { sourceEssayId: base.analysis.sourceEssayId, prompt: base.analysis.prompt, questionType: base.analysis.questionType, essayPosition: base.position, introductionText: base.intro.draftText, bodyPlan: base.bodyPlan }; }
export function getConclusionWorkspace(connection: SqliteConnection, sourceEssayId: string) { const base = loadBase(connection, sourceEssayId); return { context: conclusionContext(base), draft: new GuidedWritingConclusionRepository(connection).latestForSource(LEARNER_ID, sourceEssayId) }; }

export async function evaluateConclusion(input: { connection: SqliteConnection; sourceEssayId: string; draftId: string; conclusionText: string; provider?: GuidedWritingConclusionProvider; now?: () => Date }): Promise<{ context: GuidedWritingConclusionContext; draft: NonNullable<ReturnType<GuidedWritingConclusionRepository["view"]>>; status: "evaluated" | "fallback" | "pending"; nextAction: GuidedWritingConclusionNextAction | null; message: string | null }> {
  const text = input.conclusionText.trim(); if (!text) throw new GuidedWritingRequestError("Write the conclusion before checking it.", 400, "CONCLUSION_REQUIRED"); if (text.length > 3_000) throw new GuidedWritingRequestError("Keep the conclusion under 3,000 characters.", 400, "CONCLUSION_TOO_LONG");
  const base = loadBase(input.connection, input.sourceEssayId); const context = conclusionContext(base); const now = input.now ?? (() => new Date()); const startedAt = now().toISOString(); const config = getGuidedWritingConfig(); const repository = new GuidedWritingConclusionRepository(input.connection);
  const begun = repository.beginDraft({ id: input.draftId, learnerId: LEARNER_ID, learnerIdHash: sha256(LEARNER_ID), sourceEssayId: input.sourceEssayId, introductionDraftId: base.intro.id, bodyOneDraftId: base.bodyOneDraft.id, bodyTwoDraftId: base.bodyTwoDraft.id, conclusionText: text, inputHash: sha256({ sourceEssayId: input.sourceEssayId, introductionDraftId: base.intro.id, bodyOneDraftId: base.bodyOneDraft.id, bodyTwoDraftId: base.bodyTwoDraft.id, conclusionText: text }), provider: config.provider, model: config.model, promptVersion: GUIDED_WRITING_CONCLUSION_PROMPT_VERSION, schemaVersion: GUIDED_WRITING_CONCLUSION_SCHEMA_VERSION, startedAt });
  if (!begun.created) return { context, draft: begun.draft, status: begun.draft.status === "pending" ? "pending" : begun.draft.status === "success" ? "evaluated" : "fallback", nextAction: begun.draft.evaluation ? conclusionNextAction(begun.draft.evaluation) : null, message: null };
  const providerInput: GuidedWritingConclusionInputV1 = { ...context, schemaVersion: "guided-writing-conclusion-input.v1", draftId: input.draftId, requiredParts: base.analysis.requiredParts, conclusionText: text }; const steps: TraceStep[] = [];
  const fallback = (status: TraceStatus, code: string) => ({ context, draft: repository.finalizeDraft({ draftId: input.draftId, status, evaluation: null, errorCode: code, steps, completedAt: now().toISOString() }), status: "fallback" as const, nextAction: null, message: fallbackMessage("conclusion") });
  if (!config.enabled) return fallback("fallback", "FEATURE_DISABLED"); if (!config.apiKey || !config.model) return fallback("fallback", "PROVIDER_NOT_CONFIGURED");
  try { const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model }); const callAt = now().toISOString(); const callStart = performance.now(); const result = await provider.evaluateConclusion(providerInput, AbortSignal.timeout(config.timeoutMs)); steps.push(step("evaluate_conclusion", callAt, callStart, "completed")); const validAt = now().toISOString(); const validStart = performance.now(); const valid = validateGuidedWritingConclusionEvaluation(result.output, providerInput); steps.push(step("validate_conclusion", validAt, validStart, valid.valid ? "valid" : "invalid", valid.valid ? undefined : valid.errors)); if (!valid.valid) return fallback("invalid_output", valid.errors[0] ?? "INVALID_OUTPUT"); const draft = repository.finalizeDraft({ draftId: input.draftId, status: "success", evaluation: valid.evaluation, errorCode: null, steps, provider: result.provider, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, completedAt: now().toISOString() }); return { context, draft, status: "evaluated", nextAction: conclusionNextAction(valid.evaluation), message: null }; } catch (error) { const mapped = mappedError(error); return fallback(mapped.status, mapped.code); }
}

function corpusUse(connection: SqliteConnection, bodySessionIds: string[]): CorpusUseItem[] {
  const content = new ContentRepository(connection); const cards = new Map((content.listCards() as unknown as SentenceCardData[]).map((item) => [item.id, item])); const collocations = new Map((content.listCollocations() as unknown as CollocationData[]).map((item) => [item.id, item]));
  const rows = connection.sqlite.prepare(`SELECT session_id sessionId, node, asset_type assetType, asset_id assetId, hint_level hintLevel, evaluation_json evaluationJson, created_at createdAt, id FROM guided_writing_node_language_attempts WHERE session_id IN (?, ?) AND status = 'success' AND asset_id IS NOT NULL ORDER BY created_at, id`).all(bodySessionIds[0], bodySessionIds[1]) as Array<{ sessionId: string; node: string; assetType: "sentence" | "collocation"; assetId: string; hintLevel: number; evaluationJson: string | null; createdAt: string; id: string }>;
  const latest = new Map<string, typeof rows[number]>(); for (const row of rows) { const evaluation = row.evaluationJson ? JSON.parse(row.evaluationJson) as { verdict?: string } : null; if (evaluation?.verdict === "pass") latest.set(`${row.sessionId}:${row.node}`, row); }
  return [...latest.values()].flatMap((row) => { const item = row.assetType === "sentence" ? cards.get(row.assetId) : collocations.get(row.assetId); if (!item) return []; const label = row.assetType === "sentence" ? (item as SentenceCardData).pattern ?? (item as SentenceCardData).learning_sentence : (item as CollocationData).canonical_text; const progress = row.assetType === "sentence" ? connection.sqlite.prepare("SELECT learning_stage stage FROM review_states WHERE card_id = ?").get(row.assetId) : connection.sqlite.prepare("SELECT learning_stage stage FROM collocation_progress WHERE collocation_id = ?").get(row.assetId); return [{ sessionId: row.sessionId, node: row.node, assetType: row.assetType, assetId: row.assetId, label, hintLevel: row.hintLevel, learningState: progress && (progress as { stage: string }).stage !== "new" ? "learned" as const : "new" as const }]; });
}
function loadFullContext(connection: SqliteConnection, sourceEssayId: string) {
  const base = loadBase(connection, sourceEssayId); const conclusion = new GuidedWritingConclusionRepository(connection).latestForSource(LEARNER_ID, sourceEssayId);
  if (!(conclusion?.status === "success" && conclusion.evaluation?.task_response.status === "clear" && conclusion.evaluation.language.status === "clear")) throw new GuidedWritingRequestError("Complete a clear Conclusion before opening the full essay.", 409, "CONCLUSION_NOT_CLEAR");
  const sections = { introduction: base.intro.draftText, bodyOne: base.bodyOneDraft.draftText, bodyTwo: base.bodyTwoDraft.draftText, conclusion: conclusion.conclusionText }; const essayText = [sections.introduction, sections.bodyOne, sections.bodyTwo, sections.conclusion].join("\n\n");
  const context: GuidedWritingFullEssayContext = { sourceEssayId, prompt: base.analysis.prompt, essayPosition: base.position, sections, essayText, corpusUse: corpusUse(connection, [base.bodyOne.id, base.bodyTwo.id]) };
  return { base, conclusion, context };
}
export function getFullEssayWorkspace(connection: SqliteConnection, sourceEssayId: string) { const ready = loadFullContext(connection, sourceEssayId); return { context: ready.context, review: new GuidedWritingFullEssayRepository(connection).latestForSource(LEARNER_ID, sourceEssayId) }; }
export async function evaluateFullEssay(input: { connection: SqliteConnection; sourceEssayId: string; reviewId: string; provider?: GuidedWritingFullEssayProvider; now?: () => Date }): Promise<{ context: GuidedWritingFullEssayContext; review: NonNullable<ReturnType<GuidedWritingFullEssayRepository["view"]>>; status: "evaluated" | "fallback" | "pending"; nextAction: GuidedWritingFullEssayNextAction | null; message: string | null }> {
  const ready = loadFullContext(input.connection, input.sourceEssayId); const now = input.now ?? (() => new Date()); const startedAt = now().toISOString(); const config = getGuidedWritingConfig(); const repository = new GuidedWritingFullEssayRepository(input.connection); const refs = { introductionDraftId: ready.base.intro.id, bodyOneDraftId: ready.base.bodyOneDraft.id, bodyTwoDraftId: ready.base.bodyTwoDraft.id, conclusionDraftId: ready.conclusion.id };
  const begun = repository.beginReview({ id: input.reviewId, learnerId: LEARNER_ID, learnerIdHash: sha256(LEARNER_ID), sourceEssayId: input.sourceEssayId, ...refs, inputHash: sha256({ sourceEssayId: input.sourceEssayId, ...refs }), provider: config.provider, model: config.model, promptVersion: GUIDED_WRITING_FULL_ESSAY_PROMPT_VERSION, schemaVersion: GUIDED_WRITING_FULL_ESSAY_SCHEMA_VERSION, startedAt });
  if (!begun.created) return { context: ready.context, review: begun.review, status: begun.review.status === "pending" ? "pending" : begun.review.status === "success" ? "evaluated" : "fallback", nextAction: begun.review.evaluation ? fullEssayNextAction(begun.review.evaluation) : null, message: null };
  const providerInput: GuidedWritingFullEssayInputV1 = { schemaVersion: "guided-writing-full-essay-input.v1", reviewId: input.reviewId, prompt: { sourceEssayId: ready.base.analysis.sourceEssayId, text: ready.base.analysis.prompt, questionType: ready.base.analysis.questionType, requiredParts: ready.base.analysis.requiredParts }, essayPosition: ready.base.position, sections: ready.context.sections, essayText: ready.context.essayText }; const steps: TraceStep[] = [];
  const fallback = (status: TraceStatus, code: string) => ({ context: ready.context, review: repository.finalizeReview({ reviewId: input.reviewId, status, evaluation: null, errorCode: code, steps, completedAt: now().toISOString() }), status: "fallback" as const, nextAction: null, message: fallbackMessage("essay") });
  if (!config.enabled) return fallback("fallback", "FEATURE_DISABLED"); if (!config.apiKey || !config.model) return fallback("fallback", "PROVIDER_NOT_CONFIGURED");
  try { const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model }); const callAt = now().toISOString(); const callStart = performance.now(); const result = await provider.evaluateFullEssay(providerInput, AbortSignal.timeout(config.timeoutMs)); steps.push(step("evaluate_full_essay", callAt, callStart, "completed")); const validAt = now().toISOString(); const validStart = performance.now(); const valid = validateGuidedWritingFullEssayEvaluation(result.output, providerInput); steps.push(step("validate_full_essay", validAt, validStart, valid.valid ? "valid" : "invalid", valid.valid ? undefined : valid.errors)); if (!valid.valid) return fallback("invalid_output", valid.errors[0] ?? "INVALID_OUTPUT"); const wordCount = providerInput.essayText.trim().split(/\s+/u).length; const evaluation = wordCount < 250 ? { ...valid.evaluation, task_response: { status: "needs_revision" as const, strength_en: null, issue_type: "incomplete_response" as const, evidence_span: null, feedback_en: `The essay is ${wordCount} words. IELTS Task 2 requires at least 250, so develop the existing reasoning further without adding a new main idea.` } } : valid.evaluation; steps.push({ name: "enforce_task_length", kind: "policy", startedAt: now().toISOString(), durationMs: 0, outcome: wordCount < 250 ? "needs_revision" : "clear" }); const review = repository.finalizeReview({ reviewId: input.reviewId, status: "success", evaluation, errorCode: null, steps, provider: result.provider, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, completedAt: now().toISOString() }); return { context: ready.context, review, status: "evaluated", nextAction: fullEssayNextAction(evaluation), message: null }; } catch (error) { const mapped = mappedError(error); return fallback(mapped.status, mapped.code); }
}
