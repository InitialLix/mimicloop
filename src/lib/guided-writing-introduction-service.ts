import { sha256 } from "../db/json";
import { ContentRepository } from "../db/content-repository";
import { GuidedWritingIntroductionRepository } from "../db/guided-writing-introduction-repository";
import { GuidedWritingParagraphRepository } from "../db/guided-writing-paragraph-repository";
import { GuidedWritingRepository } from "../db/guided-writing-repository";
import type { SqliteConnection } from "../db/client";
import type { TraceStatus, TraceStep } from "../db/use-evaluation-repository";
import type { GuidedWritingParagraphDraftView } from "../domain/writing/paragraph-evaluation";
import {
  GUIDED_WRITING_INTRODUCTION_PROMPT_VERSION,
  GUIDED_WRITING_INTRODUCTION_SCHEMA_VERSION,
  introductionNextAction,
  validateGuidedWritingIntroductionEvaluation,
  type GuidedWritingIntroductionContext,
  type GuidedWritingIntroductionDraftView,
  type GuidedWritingIntroductionInputV1,
  type GuidedWritingIntroductionNextAction,
  type IntroductionComponents,
} from "../domain/writing/introduction-evaluation";
import { analyzeEssayTask } from "../domain/writing/task-analysis";
import type { SourceEssayData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import {
  DeepSeekGuidedWritingCoach,
  GuidedWritingProviderHttpError,
  type GuidedWritingIntroductionProvider,
} from "./ai/guided-writing-provider";
import { GuidedWritingRequestError } from "./guided-writing-service";

const LOCAL_LEARNER_ID = "local-default-learner";

function traceStep(
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

function mappedError(error: unknown): { status: TraceStatus; code: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") return { status: "timeout", code: "MODEL_TIMEOUT" };
  if (error instanceof GuidedWritingProviderHttpError) return { status: "error", code: `PROVIDER_HTTP_${error.status}` };
  if (error instanceof SyntaxError) return { status: "invalid_output", code: "INVALID_PROVIDER_JSON" };
  if (error instanceof TypeError) return { status: "error", code: "PROVIDER_NETWORK_ERROR" };
  return { status: "error", code: "MODEL_ERROR" };
}

function fallbackMessage(code: string) {
  if (code === "PROVIDER_NETWORK_ERROR") return "Unable to reach DeepSeek. Your introduction has been saved and remains editable.";
  if (code === "MODEL_TIMEOUT") return "DeepSeek took too long. Your introduction has been saved; try checking it again.";
  return "AI introduction feedback is temporarily unavailable. Your introduction has been saved and remains editable.";
}

function trustedAnalysis(connection: SqliteConnection, sourceEssayId: string) {
  const source = (new ContentRepository(connection).listSources() as unknown as SourceEssayData[])
    .find((item) => item.id === sourceEssayId && item.content_role !== "language_richness_corpus");
  if (!source?.ielts_prompt) throw new GuidedWritingRequestError("找不到这道已归档 IELTS 题目。", 404, "SOURCE_NOT_FOUND");
  return analyzeEssayTask(source);
}

function clearParagraph(draft: GuidedWritingParagraphDraftView | null) {
  return draft?.status === "success"
    && draft.evaluation?.logic.status === "clear"
    && draft.evaluation.language.status === "clear";
}

function loadReadyContext(connection: SqliteConnection, sourceEssayId: string): {
  context: GuidedWritingIntroductionContext;
  bodyOneSessionId: string;
  bodyTwoSessionId: string;
  bodyParagraphs: GuidedWritingIntroductionInputV1["bodyPlan"];
} {
  const analysis = trustedAnalysis(connection, sourceEssayId);
  const sessionRepository = new GuidedWritingRepository(connection);
  const paragraphRepository = new GuidedWritingParagraphRepository(connection);
  const bodyOne = sessionRepository.getLatestActive(LOCAL_LEARNER_ID, sourceEssayId, "body_1");
  const bodyTwo = sessionRepository.getLatestActive(LOCAL_LEARNER_ID, sourceEssayId, "body_2");
  if (!bodyOne || !bodyTwo || bodyOne.status !== "ready_to_draft" || bodyTwo.status !== "ready_to_draft") {
    throw new GuidedWritingRequestError("Complete both body paragraphs before writing the introduction.", 409, "BODY_PARAGRAPHS_NOT_READY");
  }
  const bodyOneDraft = paragraphRepository.latestForSession(bodyOne.id);
  const bodyTwoDraft = paragraphRepository.latestForSession(bodyTwo.id);
  if (!clearParagraph(bodyOneDraft) || !clearParagraph(bodyTwoDraft)) {
    throw new GuidedWritingRequestError("Both body paragraphs need clear Logic and Language feedback first.", 409, "BODY_PARAGRAPHS_NOT_CLEAR");
  }
  const position = bodyOne.graph.stance?.content?.trim();
  const bodyOneMainPoint = bodyOne.graph.claim?.content?.trim();
  const bodyTwoMainPoint = bodyTwo.graph.claim?.content?.trim();
  if (!position || !bodyOneMainPoint || !bodyTwoMainPoint) {
    throw new GuidedWritingRequestError("The saved essay plan is incomplete.", 409, "ESSAY_PLAN_INCOMPLETE");
  }
  const bodyOneRole = analysis.outline.find((item) => item.key === "body_1")?.role;
  const bodyTwoRole = analysis.outline.find((item) => item.key === "body_2")?.role;
  if (!bodyOneRole || !bodyTwoRole) {
    throw new GuidedWritingRequestError("This prompt does not have a trusted two-paragraph plan.", 409, "ESSAY_PLAN_UNAVAILABLE");
  }
  return {
    context: {
      sourceEssayId,
      prompt: analysis.prompt,
      questionType: analysis.questionType,
      essayPosition: position,
      bodyPlan: [
        { key: "body_1", role: bodyOneRole, mainPoint: bodyOneMainPoint },
        { key: "body_2", role: bodyTwoRole, mainPoint: bodyTwoMainPoint },
      ],
    },
    bodyOneSessionId: bodyOne.id,
    bodyTwoSessionId: bodyTwo.id,
    bodyParagraphs: [
      { key: "body_1", role: bodyOneRole, mainPoint: bodyOneMainPoint, paragraphText: bodyOneDraft!.draftText },
      { key: "body_2", role: bodyTwoRole, mainPoint: bodyTwoMainPoint, paragraphText: bodyTwoDraft!.draftText },
    ],
  };
}

export function getGuidedWritingIntroductionWorkspace(connection: SqliteConnection, sourceEssayId: string) {
  const ready = loadReadyContext(connection, sourceEssayId);
  return {
    context: ready.context,
    draft: new GuidedWritingIntroductionRepository(connection).latestForSource(LOCAL_LEARNER_ID, sourceEssayId),
  };
}

export async function evaluateGuidedWritingIntroduction(input: {
  connection: SqliteConnection;
  sourceEssayId: string;
  draftId: string;
  components: IntroductionComponents;
  provider?: GuidedWritingIntroductionProvider;
  now?: () => Date;
}): Promise<{
  context: GuidedWritingIntroductionContext;
  draft: GuidedWritingIntroductionDraftView;
  status: "evaluated" | "fallback" | "pending";
  nextAction: GuidedWritingIntroductionNextAction | null;
  message: string | null;
}> {
  const now = input.now ?? (() => new Date());
  const components = {
    opening: input.components.opening.trim(),
    taskFraming: input.components.taskFraming.trim(),
    thesis: input.components.thesis.trim(),
  };
  if (!components.taskFraming) throw new GuidedWritingRequestError("Write the task framing before checking the introduction.", 400, "TASK_FRAMING_REQUIRED");
  if (!components.thesis) throw new GuidedWritingRequestError("Write the thesis before checking the introduction.", 400, "THESIS_REQUIRED");
  if (Object.values(components).some((value) => value.length > 1_500)) {
    throw new GuidedWritingRequestError("Keep each introduction part under 1,500 characters.", 400, "INTRODUCTION_PART_TOO_LONG");
  }
  const draftText = [components.opening, components.taskFraming, components.thesis].filter(Boolean).join(" ");
  if (draftText.length > 4_000) throw new GuidedWritingRequestError("Keep the introduction under 4,000 characters.", 400, "INTRODUCTION_TOO_LONG");

  const ready = loadReadyContext(input.connection, input.sourceEssayId);
  const config = getGuidedWritingConfig();
  const startedAt = now().toISOString();
  const repository = new GuidedWritingIntroductionRepository(input.connection);
  const begun = repository.beginDraft({
    id: input.draftId,
    learnerId: LOCAL_LEARNER_ID,
    learnerIdHash: sha256(LOCAL_LEARNER_ID),
    sourceEssayId: input.sourceEssayId,
    bodyOneSessionId: ready.bodyOneSessionId,
    bodyTwoSessionId: ready.bodyTwoSessionId,
    components,
    draftText,
    inputHash: sha256({ sourceEssayId: input.sourceEssayId, bodyOneSessionId: ready.bodyOneSessionId, bodyTwoSessionId: ready.bodyTwoSessionId, components }),
    provider: config.provider,
    model: config.model,
    promptVersion: GUIDED_WRITING_INTRODUCTION_PROMPT_VERSION,
    schemaVersion: GUIDED_WRITING_INTRODUCTION_SCHEMA_VERSION,
    startedAt,
  });
  if (!begun.created) {
    return {
      context: ready.context,
      draft: begun.draft,
      status: begun.draft.status === "pending" ? "pending" : begun.draft.status === "success" ? "evaluated" : "fallback",
      nextAction: begun.draft.evaluation ? introductionNextAction(begun.draft.evaluation) : null,
      message: begun.draft.status === "pending" ? "This introduction is still being checked." : null,
    };
  }

  const analysis = trustedAnalysis(input.connection, input.sourceEssayId);
  const providerInput: GuidedWritingIntroductionInputV1 = {
    schemaVersion: "guided-writing-introduction-input.v1",
    draftId: input.draftId,
    prompt: {
      sourceEssayId: analysis.sourceEssayId,
      text: analysis.prompt,
      questionType: analysis.questionType,
      requiredParts: analysis.requiredParts,
    },
    essayPosition: ready.context.essayPosition,
    bodyPlan: ready.bodyParagraphs,
    components,
    draftText,
  };
  const steps: TraceStep[] = [];
  const finalizeFallback = (status: TraceStatus, code: string) => ({
    context: ready.context,
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
    const result = await provider.evaluateIntroduction(providerInput, AbortSignal.timeout(config.timeoutMs));
    steps.push(traceStep("evaluate_introduction", "model_call", modelStartedAt, modelStarted, "completed", {
      inputRefs: [input.draftId, ready.bodyOneSessionId, ready.bodyTwoSessionId],
    }));
    const validationStartedAt = now().toISOString();
    const validationStarted = performance.now();
    const validation = validateGuidedWritingIntroductionEvaluation(result.output, providerInput);
    steps.push(traceStep(
      "validate_introduction_evaluation",
      "validation",
      validationStartedAt,
      validationStarted,
      validation.valid ? "valid" : "invalid",
      validation.valid ? {} : { errorCodes: validation.errors },
    ));
    if (!validation.valid) return finalizeFallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
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
      completedAt: now().toISOString(),
    });
    return {
      context: ready.context,
      draft,
      status: "evaluated",
      nextAction: introductionNextAction(validation.evaluation),
      message: null,
    };
  } catch (error) {
    const mapped = mappedError(error);
    steps.push({ name: "evaluate_introduction", kind: "model_call", startedAt, durationMs: 0, outcome: mapped.status, errorCodes: [mapped.code] });
    return finalizeFallback(mapped.status, mapped.code);
  }
}
