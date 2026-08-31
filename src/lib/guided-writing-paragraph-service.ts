import { sha256 } from "../db/json";
import { ContentRepository } from "../db/content-repository";
import { GuidedWritingRepository } from "../db/guided-writing-repository";
import { GuidedWritingParagraphRepository } from "../db/guided-writing-paragraph-repository";
import type { SqliteConnection } from "../db/client";
import type { TraceStatus, TraceStep } from "../db/use-evaluation-repository";
import {
  GUIDED_WRITING_PARAGRAPH_PROMPT_VERSION,
  GUIDED_WRITING_PARAGRAPH_SCHEMA_VERSION,
  paragraphNextAction,
  validateGuidedWritingParagraphEvaluation,
  type GuidedWritingParagraphDraftView,
  type GuidedWritingParagraphInputV1,
  type GuidedWritingParagraphNextAction,
} from "../domain/writing/paragraph-evaluation";
import { analyzeEssayTask } from "../domain/writing/task-analysis";
import type { SourceEssayData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import {
  DeepSeekGuidedWritingCoach,
  GuidedWritingProviderHttpError,
  type GuidedWritingParagraphProvider,
} from "./ai/guided-writing-provider";
import { GuidedWritingRequestError } from "./guided-writing-service";

const LOCAL_LEARNER_ID = "local-default-learner";

function step(
  name: string,
  kind: TraceStep["kind"],
  startedAt: string,
  startedPerformance: number,
  outcome: string,
  extra: Pick<TraceStep, "inputRefs" | "outputRefs" | "errorCodes"> = {},
): TraceStep {
  return {
    name,
    kind,
    startedAt,
    durationMs: Math.max(0, Math.round(performance.now() - startedPerformance)),
    outcome,
    ...extra,
  };
}

function loadTrustedAnalysis(connection: SqliteConnection, sourceEssayId: string) {
  const source = (new ContentRepository(connection).listSources() as unknown as SourceEssayData[])
    .find((item) => item.id === sourceEssayId && item.content_role !== "language_richness_corpus");
  if (!source?.ielts_prompt) throw new GuidedWritingRequestError("找不到这道已归档 IELTS 题目。", 404, "SOURCE_NOT_FOUND");
  return analyzeEssayTask(source);
}

function errorStatus(error: unknown): { status: TraceStatus; code: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") return { status: "timeout", code: "MODEL_TIMEOUT" };
  if (error instanceof GuidedWritingProviderHttpError) return { status: "error", code: `PROVIDER_HTTP_${error.status}` };
  if (error instanceof SyntaxError) return { status: "invalid_output", code: "INVALID_PROVIDER_JSON" };
  if (error instanceof TypeError) return { status: "error", code: "PROVIDER_NETWORK_ERROR" };
  return { status: "error", code: "MODEL_ERROR" };
}

function fallbackMessage(code: string): string {
  if (code === "PROVIDER_NETWORK_ERROR") return "Unable to reach DeepSeek right now. Your paragraph has been saved and remains editable.";
  if (code === "MODEL_TIMEOUT") return "DeepSeek took too long to respond. Your paragraph has been saved; try checking it again.";
  return "AI paragraph feedback is temporarily unavailable. Your paragraph has been saved and remains editable.";
}

export function getLatestGuidedWritingParagraphDraft(
  connection: SqliteConnection,
  sessionId: string,
): GuidedWritingParagraphDraftView | null {
  const session = new GuidedWritingRepository(connection).getSession(sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  return new GuidedWritingParagraphRepository(connection).latestForSession(sessionId);
}

export async function evaluateGuidedWritingParagraph(input: {
  connection: SqliteConnection;
  sessionId: string;
  draftId: string;
  draftText: string;
  provider?: GuidedWritingParagraphProvider;
  now?: () => Date;
}): Promise<{
  draft: GuidedWritingParagraphDraftView;
  status: "evaluated" | "fallback" | "pending";
  nextAction: GuidedWritingParagraphNextAction | null;
  message: string | null;
}> {
  const now = input.now ?? (() => new Date());
  const draftText = input.draftText.trim();
  if (!draftText) throw new GuidedWritingRequestError("Write your paragraph before checking it.", 400, "EMPTY_DRAFT");
  if (draftText.length > 5_000) throw new GuidedWritingRequestError("Keep this body paragraph under 5,000 characters.", 400, "DRAFT_TOO_LONG");

  const sessionRepository = new GuidedWritingRepository(input.connection);
  const session = sessionRepository.getSession(input.sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  if (session.status !== "ready_to_draft" || Object.values(session.graph).some((node) => !node)) {
    throw new GuidedWritingRequestError("Complete and review the argument chain before drafting the paragraph.", 409, "ARGUMENT_NOT_READY");
  }
  const analysis = loadTrustedAnalysis(input.connection, session.sourceEssayId);
  const paragraph = analysis.outline.find((item) => item.key === session.paragraphKey);
  if (!paragraph) throw new GuidedWritingRequestError("这道题暂时没有可用的主体段任务。", 409, "BODY_TASK_UNAVAILABLE");

  const config = getGuidedWritingConfig();
  const startedAt = now().toISOString();
  const repository = new GuidedWritingParagraphRepository(input.connection);
  const begun = repository.beginDraft({
    id: input.draftId,
    sessionId: input.sessionId,
    inputHash: sha256({ sessionId: input.sessionId, draftText }),
    draftText,
    learnerIdHash: sha256(LOCAL_LEARNER_ID),
    provider: config.provider,
    model: config.model,
    promptVersion: GUIDED_WRITING_PARAGRAPH_PROMPT_VERSION,
    schemaVersion: GUIDED_WRITING_PARAGRAPH_SCHEMA_VERSION,
    startedAt,
  });
  if (!begun.created) {
    return {
      draft: begun.draft,
      status: begun.draft.status === "pending" ? "pending" : begun.draft.status === "success" ? "evaluated" : "fallback",
      nextAction: begun.draft.evaluation ? paragraphNextAction(begun.draft.evaluation) : null,
      message: begun.draft.status === "pending" ? "This paragraph is still being checked." : null,
    };
  }

  const steps: TraceStep[] = [];
  const paragraphInput: GuidedWritingParagraphInputV1 = {
    schemaVersion: "guided-writing-paragraph-input.v1",
    sessionId: session.id,
    draftId: input.draftId,
    prompt: {
      sourceEssayId: analysis.sourceEssayId,
      text: analysis.prompt,
      questionType: analysis.questionType,
      requiredParts: analysis.requiredParts,
      scopeMarkers: analysis.scopeMarkers,
    },
    paragraph: { key: session.paragraphKey, role: paragraph.role, goal: paragraph.goal },
    argumentGraph: session.graph,
    draftText,
  };

  const finalizeFallback = (status: TraceStatus, code: string) => ({
    draft: repository.finalizeDraft({
      draftId: input.draftId,
      status,
      evaluation: null,
      errorCode: code,
      steps,
      completedAt: now().toISOString(),
    }),
    status: "fallback" as const,
    nextAction: null,
    message: fallbackMessage(code),
  });

  if (!config.enabled) return finalizeFallback("fallback", "FEATURE_DISABLED");
  if (!config.apiKey || !config.model) return finalizeFallback("fallback", "PROVIDER_NOT_CONFIGURED");

  try {
    const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model });
    const modelStartedAt = now().toISOString();
    const modelStarted = performance.now();
    const result = await provider.evaluateParagraph(paragraphInput, AbortSignal.timeout(config.timeoutMs));
    steps.push(step("evaluate_paragraph", "model_call", modelStartedAt, modelStarted, "completed", {
      inputRefs: [session.id, input.draftId, ...Object.values(session.graph).flatMap((node) => node ? [node.turnId] : [])],
    }));
    const validationStartedAt = now().toISOString();
    const validationStarted = performance.now();
    const validation = validateGuidedWritingParagraphEvaluation(result.output, paragraphInput);
    steps.push(step(
      "validate_paragraph_evaluation",
      "validation",
      validationStartedAt,
      validationStarted,
      validation.valid ? "valid" : "invalid",
      validation.valid ? {} : { errorCodes: validation.errors },
    ));
    if (!validation.valid) return finalizeFallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
    const completedAt = now().toISOString();
    const draft = repository.finalizeDraft({
      draftId: input.draftId,
      status: "success",
      evaluation: validation.evaluation,
      errorCode: null,
      steps,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      completedAt,
    });
    return {
      draft,
      status: "evaluated",
      nextAction: paragraphNextAction(validation.evaluation),
      message: null,
    };
  } catch (error) {
    const mapped = errorStatus(error);
    steps.push({
      name: "evaluate_paragraph",
      kind: "model_call",
      startedAt,
      durationMs: 0,
      outcome: mapped.status,
      errorCodes: [mapped.code],
    });
    return finalizeFallback(mapped.status, mapped.code);
  }
}
