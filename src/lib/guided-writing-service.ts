import { performance } from "node:perf_hooks";
import { ContentRepository } from "../db/content-repository";
import { sha256 } from "../db/json";
import {
  GuidedWritingConflictError,
  GuidedWritingRepository,
} from "../db/guided-writing-repository";
import { GuidedWritingParagraphRepository } from "../db/guided-writing-paragraph-repository";
import type { SqliteConnection } from "../db/client";
import type { TraceStep, TraceStatus } from "../db/use-evaluation-repository";
import {
  ESSAY_TASK_ANALYSIS_VERSION,
  analyzeEssayTask,
} from "../domain/writing/task-analysis";
import {
  GUIDED_WRITING_CHAIN_REVIEW_SCHEMA_VERSION,
  GUIDED_WRITING_COACH_PROMPT_VERSION,
  GUIDED_WRITING_COACH_SCHEMA_VERSION,
  selectGuidedWritingChainAction,
  selectGuidedWritingCoachAction,
  validateGuidedWritingChainReview,
  validateGuidedWritingCoachEvaluation,
  type GuidedWritingChainReviewInputV1,
  type GuidedWritingCoachInputV1,
  type GuidedWritingSessionView,
  type GuidedWritingParagraphKey,
  emptyArgumentGraph,
} from "../domain/writing/guided-writing-coach";
import type { SourceEssayData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import {
  DeepSeekGuidedWritingCoach,
  GuidedWritingProviderHttpError,
  type GuidedWritingCoachProvider,
} from "./ai/guided-writing-provider";

const LOCAL_LEARNER_ID = "local-default-learner";

export class GuidedWritingRequestError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
  }
}

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

export function startGuidedWritingSession(input: {
  connection: SqliteConnection;
  sessionId: string;
  sourceEssayId: string;
  paragraphKey?: GuidedWritingParagraphKey;
  fromSessionId?: string;
  now?: () => Date;
}): GuidedWritingSessionView {
  const analysis = loadTrustedAnalysis(input.connection, input.sourceEssayId);
  const createdAt = (input.now ?? (() => new Date()))().toISOString();
  const repository = new GuidedWritingRepository(input.connection);
  const paragraphKey = input.paragraphKey ?? "body_1";
  const body = analysis.outline.find((item) => item.key === paragraphKey);
  if (!body) throw new GuidedWritingRequestError("这道题暂时没有可用的主体段任务。", 409, "BODY_TASK_UNAVAILABLE");
  let initialGraph;
  let initialNode;
  if (paragraphKey === "body_2") {
    if (!input.fromSessionId) {
      throw new GuidedWritingRequestError("请先完成第一主体段，再进入第二主体段。", 409, "BODY_1_REQUIRED");
    }
    const bodyOne = repository.getSession(input.fromSessionId);
    if (
      !bodyOne
      || bodyOne.sourceEssayId !== analysis.sourceEssayId
      || bodyOne.paragraphKey !== "body_1"
      || bodyOne.status !== "ready_to_draft"
      || !bodyOne.graph.stance
    ) {
      throw new GuidedWritingRequestError("第一主体段尚未完成，暂时不能开始第二主体段。", 409, "BODY_1_NOT_READY");
    }
    const bodyOneDraft = new GuidedWritingParagraphRepository(input.connection).latestForSession(bodyOne.id);
    if (
      !bodyOneDraft?.evaluation
      || bodyOneDraft.evaluation.logic.status !== "clear"
      || bodyOneDraft.evaluation.language.status !== "clear"
    ) {
      throw new GuidedWritingRequestError("请先完成并通过第一主体段的逻辑与语言检查。", 409, "BODY_1_PARAGRAPH_NOT_READY");
    }
    initialGraph = { ...emptyArgumentGraph(), stance: bodyOne.graph.stance };
    initialNode = "claim" as const;
  }
  const result = repository.createSession({
    id: input.sessionId,
    learnerId: LOCAL_LEARNER_ID,
    sourceEssayId: analysis.sourceEssayId,
    paragraphKey,
    taskAnalysisVersion: analysis.schemaVersion,
    promptSnapshot: analysis.prompt,
    questionType: analysis.questionType,
    createdAt,
    initialGraph,
    initialNode,
  });
  return repository.view(result.session.id)!;
}

export function getLatestGuidedWritingSession(
  connection: SqliteConnection,
  sourceEssayId: string,
  paragraphKey?: GuidedWritingParagraphKey,
): GuidedWritingSessionView | null {
  const repository = new GuidedWritingRepository(connection);
  const session = repository.getLatestActive(LOCAL_LEARNER_ID, sourceEssayId, paragraphKey);
  return session ? repository.view(session.id) : null;
}

export function reopenGuidedWritingNode(input: {
  connection: SqliteConnection;
  sessionId: string;
  node: GuidedWritingCoachInputV1["currentNode"];
  now?: () => Date;
}): GuidedWritingSessionView {
  const repository = new GuidedWritingRepository(input.connection);
  const session = repository.getSession(input.sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  try {
    return repository.reopenNode({
      sessionId: input.sessionId,
      node: input.node,
      updatedAt: (input.now ?? (() => new Date()))().toISOString(),
    });
  } catch (error) {
    if (error instanceof GuidedWritingConflictError) {
      throw new GuidedWritingRequestError(error.message, 409, "REVISION_CONFLICT");
    }
    throw error;
  }
}

export function cancelUnchangedGuidedWritingRevision(input: {
  connection: SqliteConnection;
  sessionId: string;
  now?: () => Date;
}): GuidedWritingSessionView {
  const repository = new GuidedWritingRepository(input.connection);
  const session = repository.getSession(input.sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  try {
    return repository.cancelUnchangedRevision({
      sessionId: input.sessionId,
      updatedAt: (input.now ?? (() => new Date()))().toISOString(),
    });
  } catch (error) {
    if (error instanceof GuidedWritingConflictError) {
      throw new GuidedWritingRequestError(error.message, 409, "REVISION_CANCEL_CONFLICT");
    }
    throw error;
  }
}

function errorStatus(error: unknown): { status: TraceStatus; code: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") return { status: "timeout", code: "MODEL_TIMEOUT" };
  if (error instanceof GuidedWritingProviderHttpError) return { status: "error", code: `PROVIDER_HTTP_${error.status}` };
  if (error instanceof SyntaxError) return { status: "invalid_output", code: "INVALID_PROVIDER_JSON" };
  if (error instanceof TypeError) return { status: "error", code: "PROVIDER_NETWORK_ERROR" };
  return { status: "error", code: "MODEL_ERROR" };
}

function fallbackMessage(code: string): string {
  if (code === "PROVIDER_NETWORK_ERROR") {
    return "Unable to reach DeepSeek right now. Your answer has been saved; check the local server connection and try again.";
  }
  if (code === "MODEL_TIMEOUT") {
    return "DeepSeek took too long to respond. Your answer has been saved; you can try checking it again.";
  }
  return "AI coaching is temporarily unavailable. Your answer has been saved; you can try checking it again.";
}

export async function answerGuidedWritingTurn(input: {
  connection: SqliteConnection;
  sessionId: string;
  turnId: string;
  learnerAnswer: string;
  provider?: GuidedWritingCoachProvider;
  now?: () => Date;
}): Promise<{ session: GuidedWritingSessionView; status: "evaluated" | "fallback" | "pending"; message: string | null }> {
  const now = input.now ?? (() => new Date());
  const repository = new GuidedWritingRepository(input.connection);
  const session = repository.getSession(input.sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  if (!input.learnerAnswer.trim()) throw new GuidedWritingRequestError("Please answer the question in English first.", 400, "EMPTY_ANSWER");
  if (input.learnerAnswer.length > 1_200) throw new GuidedWritingRequestError("Keep this planning answer under 1,200 characters.", 400, "ANSWER_TOO_LONG");
  const currentView = repository.view(session.id)!;
  if (session.status !== "building_argument" || !session.currentNode || !currentView.currentQuestionEn) {
    throw new GuidedWritingRequestError("This argument chain is already ready for drafting.", 409, "SESSION_ALREADY_READY");
  }
  const analysis = loadTrustedAnalysis(input.connection, session.sourceEssayId);
  const paragraph = analysis.outline.find((item) => item.key === session.paragraphKey);
  if (!paragraph) throw new GuidedWritingRequestError("这道题暂时没有可用的主体段任务。", 409, "BODY_TASK_UNAVAILABLE");
  const config = getGuidedWritingConfig();
  const startedAt = now().toISOString();
  const begun = repository.beginTurn({
    id: input.turnId,
    sessionId: session.id,
    inputHash: sha256({ sessionId: session.id, learnerAnswer: input.learnerAnswer }),
    questionEn: currentView.currentQuestionEn,
    learnerAnswer: input.learnerAnswer,
    learnerIdHash: sha256(LOCAL_LEARNER_ID),
    provider: config.provider,
    model: config.model,
    promptVersion: GUIDED_WRITING_COACH_PROMPT_VERSION,
    schemaVersion: GUIDED_WRITING_COACH_SCHEMA_VERSION,
    startedAt,
  });
  if (!begun.created) {
    const view = repository.view(session.id)!;
    return {
      session: view,
      status: begun.turn.status === "pending" ? "pending" : begun.turn.status === "success" ? "evaluated" : "fallback",
      message: begun.turn.status === "pending" ? "This answer is still being checked." : null,
    };
  }

  const steps: TraceStep[] = [];
  const coachInput: GuidedWritingCoachInputV1 = {
    schemaVersion: "guided-writing-coach-input.v1",
    sessionId: session.id,
    turnId: input.turnId,
    prompt: {
      sourceEssayId: analysis.sourceEssayId,
      text: analysis.prompt,
      questionType: analysis.questionType,
      requiredParts: analysis.requiredParts,
      scopeMarkers: analysis.scopeMarkers,
    },
    paragraph: { key: session.paragraphKey, role: paragraph.role, goal: paragraph.goal },
    currentNode: session.currentNode,
    developmentRelation: currentView.developmentRelation,
    graph: session.graph,
    questionEn: currentView.currentQuestionEn,
    learnerAnswer: input.learnerAnswer,
  };

  const finalizeFallback = (status: TraceStatus, code: string) => ({
    session: repository.finalizeTurn({
      turnId: input.turnId,
      status,
      evaluation: null,
      action: null,
      errorCode: code,
      steps,
      completedAt: now().toISOString(),
    }),
    status: "fallback" as const,
    message: fallbackMessage(code),
  });

  if (!config.enabled) return finalizeFallback("fallback", "FEATURE_DISABLED");
  if (!config.apiKey || !config.model) return finalizeFallback("fallback", "PROVIDER_NOT_CONFIGURED");

  let activeModelStep = "evaluate_argument_node";
  try {
    const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model });
    const modelStartedAt = now().toISOString();
    const modelStarted = performance.now();
    const result = await provider.evaluate(coachInput, AbortSignal.timeout(config.timeoutMs));
    steps.push(step("evaluate_argument_node", "model_call", modelStartedAt, modelStarted, "completed", {
      inputRefs: [session.id, input.turnId, session.currentNode],
    }));
    const validationStartedAt = now().toISOString();
    const validationStarted = performance.now();
    const validation = validateGuidedWritingCoachEvaluation(result.output, coachInput);
    steps.push(step(
      "validate_coach_output",
      "validation",
      validationStartedAt,
      validationStarted,
      validation.valid ? "valid" : "invalid",
      validation.valid ? {} : { errorCodes: validation.errors },
    ));
    if (!validation.valid) return finalizeFallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
    const actionStartedAt = now().toISOString();
    const actionStarted = performance.now();
    let action = selectGuidedWritingCoachAction(
      session.currentNode,
      validation.evaluation,
      {
        questionType: analysis.questionType,
        paragraphKey: session.paragraphKey,
        developmentRelation: currentView.developmentRelation,
      },
    );
    const revisingSavedNode = Boolean(session.graph[session.currentNode]);
    const savedNextNode = action.nextNode ? session.graph[action.nextNode] : null;
    if (
      validation.evaluation.verdict === "accept"
      && revisingSavedNode
      && action.type === "ACCEPT_AND_CONTINUE"
      && action.nextNode
      && action.nextNode !== "stance"
      && savedNextNode
      && !action.reuseSuggestion
    ) {
      action = {
        ...action,
        reuseSuggestion: {
          sourceTurnId: savedNextNode.turnId,
          targetNode: action.nextNode,
          text: savedNextNode.content,
        },
      };
    }
    steps.push(step("select_next_question", "policy", actionStartedAt, actionStarted, action.type));
    let inputTokens = result.inputTokens;
    let outputTokens = result.outputTokens;
    let providerName = result.provider;
    let modelName = result.model;

    if (session.currentNode === "result" && validation.evaluation.verdict === "accept") {
      const fullGraph = {
        ...session.graph,
        result: {
          content: validation.evaluation.accepted_span ?? input.learnerAnswer,
          origin: "user_after_question" as const,
          turnId: input.turnId,
        },
      };
      const chainInput: GuidedWritingChainReviewInputV1 = {
        schemaVersion: "guided-writing-chain-review-input.v1",
        sessionId: session.id,
        turnId: input.turnId,
        prompt: coachInput.prompt,
        paragraph: coachInput.paragraph,
        developmentRelation: currentView.developmentRelation,
        graph: fullGraph,
      };
      activeModelStep = "review_argument_chain";
      const reviewStartedAt = now().toISOString();
      const reviewStarted = performance.now();
      const reviewResult = await provider.reviewChain(chainInput, AbortSignal.timeout(config.timeoutMs));
      steps.push(step("review_argument_chain", "model_call", reviewStartedAt, reviewStarted, "completed", {
        inputRefs: [
          session.id,
          input.turnId,
          ...Object.values(fullGraph).flatMap((node) => node ? [node.turnId] : []),
        ],
        outputRefs: [GUIDED_WRITING_CHAIN_REVIEW_SCHEMA_VERSION],
      }));
      const reviewValidationStartedAt = now().toISOString();
      const reviewValidationStarted = performance.now();
      const reviewValidation = validateGuidedWritingChainReview(reviewResult.output, chainInput);
      steps.push(step(
        "validate_chain_review",
        "validation",
        reviewValidationStartedAt,
        reviewValidationStarted,
        reviewValidation.valid ? "valid" : "invalid",
        reviewValidation.valid ? {} : { errorCodes: reviewValidation.errors },
      ));
      if (!reviewValidation.valid) {
        return finalizeFallback("invalid_output", reviewValidation.errors[0] ?? "INVALID_CHAIN_REVIEW");
      }
      if (reviewValidation.review.verdict === "cannot_judge") {
        return finalizeFallback("fallback", "CHAIN_REVIEW_CANNOT_JUDGE");
      }
      const chainActionStartedAt = now().toISOString();
      const chainActionStarted = performance.now();
      action = selectGuidedWritingChainAction(reviewValidation.review, {
        questionType: analysis.questionType,
        paragraphKey: session.paragraphKey,
        developmentRelation: currentView.developmentRelation,
      })!;
      steps.push(step("select_chain_action", "policy", chainActionStartedAt, chainActionStarted, action.type));
      inputTokens = inputTokens === null || reviewResult.inputTokens === null
        ? null
        : inputTokens + reviewResult.inputTokens;
      outputTokens = outputTokens === null || reviewResult.outputTokens === null
        ? null
        : outputTokens + reviewResult.outputTokens;
      providerName = reviewResult.provider;
      modelName = reviewResult.model;
    }
    const completedAt = now().toISOString();
    return {
      session: repository.finalizeTurn({
        turnId: input.turnId,
        status: "success",
        evaluation: validation.evaluation,
        action,
        errorCode: null,
        steps,
        provider: providerName,
        model: modelName,
        inputTokens,
        outputTokens,
        completedAt,
      }),
      status: "evaluated",
      message: null,
    };
  } catch (error) {
    const mapped = errorStatus(error);
    steps.push({
      name: activeModelStep,
      kind: "model_call",
      startedAt,
      durationMs: 0,
      outcome: mapped.status,
      errorCodes: [mapped.code],
    });
    return finalizeFallback(mapped.status, mapped.code);
  }
}

export { GuidedWritingConflictError };
