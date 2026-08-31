import { sha256 } from "../db/json";
import { GuidedWritingNodeLanguageRepository } from "../db/guided-writing-node-language-repository";
import { GuidedWritingRepository } from "../db/guided-writing-repository";
import { ContentRepository } from "../db/content-repository";
import type { SqliteConnection } from "../db/client";
import type { TraceStatus, TraceStep } from "../db/use-evaluation-repository";
import {
  GUIDED_WRITING_NODE_LANGUAGE_PROMPT_VERSION,
  GUIDED_WRITING_NODE_LANGUAGE_SCHEMA_VERSION,
  validateGuidedWritingNodeLanguageEvaluation,
  type GuidedWritingNodeLanguageAttemptView,
  type GuidedWritingNodeLanguageInputV1,
  type NodeHintLevel,
} from "../domain/writing/node-language-activation";
import type { WritingLanguageNode } from "../domain/writing/learned-expression-retrieval";
import { analyzeEssayTask } from "../domain/writing/task-analysis";
import type { SourceEssayData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import {
  DeepSeekGuidedWritingCoach,
  GuidedWritingProviderHttpError,
  type GuidedWritingNodeLanguageProvider,
} from "./ai/guided-writing-provider";
import { retrieveLearnedWritingAssets } from "./guided-writing-expression-service";
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
  if (code === "PROVIDER_NETWORK_ERROR") return "Unable to reach DeepSeek. Your node draft has been saved and remains editable.";
  if (code === "MODEL_TIMEOUT") return "DeepSeek took too long. Your node draft has been saved; try checking it again.";
  return "AI node feedback is temporarily unavailable. Your draft has been saved and remains editable.";
}

function trustedAnalysis(connection: SqliteConnection, sourceEssayId: string) {
  const source = (new ContentRepository(connection).listSources() as unknown as SourceEssayData[])
    .find((item) => item.id === sourceEssayId && item.content_role !== "language_richness_corpus");
  if (!source?.ielts_prompt) throw new GuidedWritingRequestError("找不到这道已归档 IELTS 题目。", 404, "SOURCE_NOT_FOUND");
  return analyzeEssayTask(source);
}

export function getGuidedWritingNodeLanguageAttempts(
  connection: SqliteConnection,
  sessionId: string,
): GuidedWritingNodeLanguageAttemptView[] {
  const session = new GuidedWritingRepository(connection).getSession(sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  return new GuidedWritingNodeLanguageRepository(connection).latestForSession(sessionId);
}

export async function evaluateGuidedWritingNodeLanguage(input: {
  connection: SqliteConnection;
  sessionId: string;
  attemptId: string;
  node: WritingLanguageNode;
  learnerText: string;
  assetType: "sentence" | "collocation" | null;
  assetId: string | null;
  hintLevel: NodeHintLevel;
  provider?: GuidedWritingNodeLanguageProvider;
  now?: () => Date;
}): Promise<{
  attempt: GuidedWritingNodeLanguageAttemptView;
  status: "evaluated" | "fallback" | "pending";
  message: string | null;
}> {
  const now = input.now ?? (() => new Date());
  const learnerText = input.learnerText.trim();
  if (!learnerText) throw new GuidedWritingRequestError("Write this node before checking it.", 400, "EMPTY_NODE_DRAFT");
  if (learnerText.length > 1_200) throw new GuidedWritingRequestError("Keep this node under 1,200 characters.", 400, "NODE_DRAFT_TOO_LONG");
  if (![0, 1, 2, 3, 4].includes(input.hintLevel)) throw new GuidedWritingRequestError("Invalid hint level.", 400, "INVALID_HINT_LEVEL");

  const sessionRepository = new GuidedWritingRepository(input.connection);
  const session = sessionRepository.getSession(input.sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  if (session.status !== "ready_to_draft" || !session.graph[input.node]) {
    throw new GuidedWritingRequestError("Complete and review the argument chain first.", 409, "ARGUMENT_NOT_READY");
  }
  const retrieval = retrieveLearnedWritingAssets(input.connection, input.sessionId, input.node, learnerText);
  const asset = input.assetId && input.assetType
    ? retrieval.assets.find((candidate) => candidate.assetId === input.assetId && candidate.assetType === input.assetType) ?? null
    : null;
  if (input.assetId && input.assetType && !asset) {
    throw new GuidedWritingRequestError("The selected corpus asset is not available for this node.", 400, "ASSET_NOT_AVAILABLE");
  }
  if (input.hintLevel > 0 && !asset) {
    throw new GuidedWritingRequestError("A hinted attempt must reference its corpus asset.", 400, "HINT_ASSET_REQUIRED");
  }

  const analysis = trustedAnalysis(input.connection, session.sourceEssayId);
  const paragraph = analysis.outline.find((item) => item.key === session.paragraphKey);
  if (!paragraph) throw new GuidedWritingRequestError("这道题暂时没有可用的主体段任务。", 409, "BODY_TASK_UNAVAILABLE");
  const config = getGuidedWritingConfig();
  const startedAt = now().toISOString();
  const repository = new GuidedWritingNodeLanguageRepository(input.connection);
  const inputHash = sha256({
    sessionId: input.sessionId,
    node: input.node,
    learnerText,
    assetType: asset?.assetType ?? null,
    assetId: asset?.assetId ?? null,
    hintLevel: input.hintLevel,
  });
  const begun = repository.beginAttempt({
    id: input.attemptId,
    sessionId: input.sessionId,
    node: input.node,
    learnerText,
    assetType: asset?.assetType ?? null,
    assetId: asset?.assetId ?? null,
    hintLevel: input.hintLevel,
    inputHash,
    learnerIdHash: sha256(LOCAL_LEARNER_ID),
    provider: config.provider,
    model: config.model,
    promptVersion: GUIDED_WRITING_NODE_LANGUAGE_PROMPT_VERSION,
    schemaVersion: GUIDED_WRITING_NODE_LANGUAGE_SCHEMA_VERSION,
    startedAt,
  });
  if (!begun.created) {
    return {
      attempt: begun.attempt,
      status: begun.attempt.status === "pending" ? "pending" : begun.attempt.status === "success" ? "evaluated" : "fallback",
      message: begun.attempt.status === "pending" ? "This node is still being checked." : null,
    };
  }

  const providerInput: GuidedWritingNodeLanguageInputV1 = {
    schemaVersion: "guided-writing-node-language-input.v1",
    sessionId: session.id,
    attemptId: input.attemptId,
    prompt: { sourceEssayId: analysis.sourceEssayId, text: analysis.prompt, questionType: analysis.questionType },
    paragraph: { key: session.paragraphKey, role: paragraph.role, goal: paragraph.goal },
    node: input.node,
    plannedMeaning: session.graph[input.node]!.content,
    argumentGraph: session.graph,
    learnerText,
    assistance: { hintLevel: input.hintLevel, targetWasShown: input.hintLevel >= 2 && asset !== null },
    targetAsset: input.hintLevel >= 2 && asset ? {
      id: asset.assetId,
      assetType: asset.assetType,
      transferUnit: asset.transferUnit,
      englishForm: asset.englishForm,
    } : null,
  };
  const steps: TraceStep[] = [];
  const finalizeFallback = (status: TraceStatus, code: string) => ({
    attempt: repository.finalizeAttempt({
      attemptId: input.attemptId,
      status,
      evaluation: null,
      errorCode: code,
      steps,
      completedAt: now().toISOString(),
    }),
    status: "fallback" as const,
    message: fallbackMessage(code),
  });
  if (!config.enabled) return finalizeFallback("fallback", "FEATURE_DISABLED");
  if (!config.apiKey || !config.model) return finalizeFallback("fallback", "PROVIDER_NOT_CONFIGURED");

  try {
    const provider = input.provider ?? new DeepSeekGuidedWritingCoach({ apiKey: config.apiKey, model: config.model });
    const modelStartedAt = now().toISOString();
    const modelStarted = performance.now();
    const result = await provider.evaluateNodeLanguage(providerInput, AbortSignal.timeout(config.timeoutMs));
    steps.push(traceStep("evaluate_node_language", "model_call", modelStartedAt, modelStarted, "completed", {
      inputRefs: [session.id, input.attemptId, session.graph[input.node]!.turnId, ...(asset ? [asset.assetId] : [])],
    }));
    const validationStartedAt = now().toISOString();
    const validationStarted = performance.now();
    const validation = validateGuidedWritingNodeLanguageEvaluation(result.output, providerInput);
    steps.push(traceStep(
      "validate_node_language_evaluation",
      "validation",
      validationStartedAt,
      validationStarted,
      validation.valid ? "valid" : "invalid",
      validation.valid ? {} : { errorCodes: validation.errors },
    ));
    if (!validation.valid) return finalizeFallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
    return {
      attempt: repository.finalizeAttempt({
        attemptId: input.attemptId,
        status: "success",
        evaluation: validation.evaluation,
        errorCode: null,
        steps,
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        completedAt: now().toISOString(),
      }),
      status: "evaluated",
      message: null,
    };
  } catch (error) {
    const mapped = mappedError(error);
    steps.push({ name: "evaluate_node_language", kind: "model_call", startedAt, durationMs: 0, outcome: mapped.status, errorCodes: [mapped.code] });
    return finalizeFallback(mapped.status, mapped.code);
  }
}
