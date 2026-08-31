import { performance } from "node:perf_hooks";
import { ContentRepository } from "../db/content-repository";
import { sha256 } from "../db/json";
import type { SqliteConnection } from "../db/client";
import {
  IdempotencyConflictError,
  UseEvaluationRepository,
  type StoredUseEvaluationRun,
  type TraceStep,
  type TraceStatus,
} from "../db/use-evaluation-repository";
import {
  USE_EVALUATION_PROMPT_VERSION,
  USE_EVALUATION_SCHEMA_VERSION,
  buildEmptyAnswerEvaluation,
  mapEvaluationToFeedback,
  validateUseEvaluation,
  type UseEvaluationInputV1,
  type UseEvaluationV1,
} from "../domain/practice/use-evaluation";
import {
  MAX_USE_RETRIES,
  selectTeachingAction,
  type TeachingActionV1,
} from "../domain/practice/teaching-action";
import {
  parseCollocationUseExerciseRef,
  parseSentenceUseExerciseRef,
} from "../domain/practice/use-exercise-ref";
import { buildUseTask } from "../domain/practice/use-task";
import type { CollocationData, SentenceCardData } from "./content-types";
import { getUseEvaluatorConfig } from "./ai/config";
import {
  DeepSeekChatUseEvaluator,
  UseEvaluatorProviderHttpError,
  type UseEvaluatorProvider,
} from "./ai/use-evaluator-provider";

export type UseEvaluationServiceResult = {
  attemptId: string;
  status: "evaluated" | "fallback" | "pending";
  feedback: StoredUseEvaluationRun["feedback"];
  teachingAction: TeachingActionV1 | null;
  retryIndex: number;
  model: string | null;
  message: string | null;
  traceId: string;
  duplicate: boolean;
};

export class UseEvaluationRequestError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
  }
}

function resolveRetryContext(
  repository: UseEvaluationRepository,
  previousAttemptId: string | null,
  exerciseRef: string,
) {
  if (!previousAttemptId) return { retryIndex: 0, previousHints: [] as NonNullable<UseEvaluationV1["minimal_hint"]>[] };
  const previous = repository.get(previousAttemptId);
  if (!previous || previous.exerciseRef !== exerciseRef) {
    throw new UseEvaluationRequestError("找不到这次修改对应的上一版答案。", 400, "INVALID_PREVIOUS_ATTEMPT");
  }
  if (previous.status === "pending") {
    throw new UseEvaluationRequestError("上一版答案仍在检查中，请稍后再试。", 409, "PREVIOUS_ATTEMPT_PENDING");
  }
  if (previous.retryIndex >= MAX_USE_RETRIES) {
    throw new UseEvaluationRequestError("本题已达到修改次数上限，请查看参考答案并完成自评。", 409, "RETRY_LIMIT_REACHED");
  }

  const previousHints: NonNullable<UseEvaluationV1["minimal_hint"]>[] = [];
  const visited = new Set<string>();
  let cursor: StoredUseEvaluationRun | null = previous;
  while (cursor) {
    if (visited.has(cursor.attemptId)) {
      throw new UseEvaluationRequestError("答案修改记录无效。", 409, "INVALID_RETRY_CHAIN");
    }
    visited.add(cursor.attemptId);
    if (cursor.teachingAction?.type === "GIVE_MINIMAL_HINT") previousHints.push(cursor.teachingAction.hint);
    if (!cursor.previousAttemptId) break;
    cursor = repository.get(cursor.previousAttemptId);
    if (cursor && cursor.exerciseRef !== exerciseRef) {
      throw new UseEvaluationRequestError("答案修改记录与本题不匹配。", 409, "INVALID_RETRY_CHAIN");
    }
  }
  return { retryIndex: previous.retryIndex + 1, previousHints };
}

function storedResult(
  run: StoredUseEvaluationRun,
  duplicate: boolean,
  repository: UseEvaluationRepository,
): UseEvaluationServiceResult {
  const model = repository.getTrace(run.traceId)?.model ?? null;
  if (run.status === "pending") return {
    attemptId: run.attemptId,
    status: "pending",
    feedback: null,
    teachingAction: null,
    retryIndex: run.retryIndex,
    model,
    message: "这次评价仍在处理中，请稍后重试。",
    traceId: run.traceId,
    duplicate,
  };
  if (run.status === "success") return {
    attemptId: run.attemptId,
    status: "evaluated",
    feedback: run.feedback,
    teachingAction: run.teachingAction,
    retryIndex: run.retryIndex,
    model,
    message: null,
    traceId: run.traceId,
    duplicate,
  };
  return {
    attemptId: run.attemptId,
    status: "fallback",
    feedback: run.feedback,
    teachingAction: run.teachingAction,
    retryIndex: run.retryIndex,
    model,
    message: "AI 反馈暂时不可用；你的答案已保留，仍可查看参考答案并完成自评。",
    traceId: run.traceId,
    duplicate,
  };
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

type TrustedUseExercise = {
  exerciseKind: StoredUseEvaluationRun["exerciseKind"];
  assetId: string;
  assetRevision: number;
  topic: string | undefined;
  exercise: UseEvaluationInputV1["exercise"];
};

function loadTrustedUseExercise(connection: SqliteConnection, exerciseRef: string): TrustedUseExercise {
  const content = new ContentRepository(connection);
  const collocationRef = parseCollocationUseExerciseRef(exerciseRef);
  if (collocationRef) {
    const collocation = (content.listCollocations() as unknown as CollocationData[])
      .find((item) => item.id === collocationRef.id && item.learning_mode === "recall_use");
    if (!collocation?.exercise_seed.guided_application) {
      throw new UseEvaluationRequestError("找不到可评价的已审核 Use 练习。", 404, "EXERCISE_NOT_FOUND");
    }
    if (collocation.content_revision !== collocationRef.revision) {
      throw new UseEvaluationRequestError("练习内容已更新，请刷新页面后重试。", 409, "STALE_EXERCISE_REF");
    }
    const seed = collocation.exercise_seed.guided_application;
    const targetType = collocation.expression_type === "fixed_phrase"
      ? "fixed_phrase"
      : collocation.expression_type === "sentence_frame"
        ? "sentence_pattern"
        : "collocation";
    return {
      exerciseKind: "collocation_use",
      assetId: collocation.id,
      assetRevision: collocation.content_revision,
      topic: collocation.topics[0],
      exercise: {
        id: exerciseRef,
        exerciseType: "collocation_use",
        instructionZh: "根据中文提示写出英文句子，并自然使用目标表达。",
        intendedMeaningZh: seed.prompt_zh,
        targetAsset: {
          id: collocation.id,
          type: targetType,
          canonicalText: collocation.canonical_text,
          acceptedVariants: collocation.accepted_answers,
          commonErrors: collocation.common_error ? [collocation.common_error] : [],
        },
        referenceAnswers: [seed.reference_answer],
        allowedParaphrase: true,
      },
    };
  }

  const sentenceRef = parseSentenceUseExerciseRef(exerciseRef);
  if (!sentenceRef) throw new UseEvaluationRequestError("无效的练习引用。", 400, "INVALID_EXERCISE_REF");
  const card = (content.listCards() as unknown as SentenceCardData[])
    .find((item) => item.id === sentenceRef.id && item.content_status === "approved");
  if (!card) throw new UseEvaluationRequestError("找不到可评价的已审核 Use 练习。", 404, "EXERCISE_NOT_FOUND");
  if (card.content_revision !== sentenceRef.revision) {
    throw new UseEvaluationRequestError("练习内容已更新，请刷新页面后重试。", 409, "STALE_EXERCISE_REF");
  }
  const task = buildUseTask(card);
  if (task.exerciseType !== sentenceRef.exerciseType) {
    throw new UseEvaluationRequestError("练习类型与已审核内容不一致。", 409, "STALE_EXERCISE_REF");
  }
  const sentenceSeed = task.mode === "structure"
    ? card.exercise_seed.slot_replacement?.[0]
    : card.exercise_seed.guided_application;
  const targetText = task.mode === "structure" ? task.pattern : task.targetChunks[0]?.text;
  if (!sentenceSeed || !targetText) {
    throw new UseEvaluationRequestError("找不到可评价的已审核 Use 练习。", 404, "EXERCISE_NOT_FOUND");
  }
  return {
    exerciseKind: "sentence_use",
    assetId: card.id,
    assetRevision: card.content_revision,
    topic: card.topics[0],
    exercise: {
      id: exerciseRef,
      exerciseType: "sentence_use",
      instructionZh: task.mode === "structure"
        ? "根据中文提示完成结构仿写；保留目标句型关系，占位符内容可以自然改写。"
        : "根据中文提示写出英文句子，并自然使用目标词块。",
      intendedMeaningZh: sentenceSeed.prompt_zh,
      targetAsset: {
        id: card.id,
        type: task.mode === "structure" ? "sentence_pattern" : "collocation",
        canonicalText: targetText,
        acceptedVariants: task.mode === "structure" ? [task.referenceAnswer] : [targetText],
        commonErrors: [],
      },
      referenceAnswers: [task.referenceAnswer],
      allowedParaphrase: true,
    },
  };
}

export async function evaluateUseAttempt({
  connection,
  attemptId,
  exerciseRef,
  learnerAnswer,
  previousAttemptId = null,
  provider,
  now = () => new Date(),
  timeoutMs,
}: {
  connection: SqliteConnection;
  attemptId: string;
  exerciseRef: string;
  learnerAnswer: string;
  previousAttemptId?: string | null;
  provider?: UseEvaluatorProvider | null;
  now?: () => Date;
  timeoutMs?: number;
}): Promise<UseEvaluationServiceResult> {
  const steps: TraceStep[] = [];
  const readStartedAt = now().toISOString();
  const readStarted = performance.now();
  const trusted = loadTrustedUseExercise(connection, exerciseRef);
  steps.push(step("load_use_exercise", "db_read", readStartedAt, readStarted, "approved_exercise_loaded", {
    inputRefs: [exerciseRef],
    outputRefs: [trusted.assetId],
  }));

  const repository = new UseEvaluationRepository(connection);
  const retryContext = resolveRetryContext(repository, previousAttemptId, exerciseRef);
  const input: UseEvaluationInputV1 = {
    schemaVersion: "use-eval-input.v1",
    attemptId,
    exercise: trusted.exercise,
    learnerAnswer,
    context: {
      topic: trusted.topic,
      priorHintLevel: retryContext.previousHints.length,
      retryIndex: retryContext.retryIndex,
    },
  };

  const config = getUseEvaluatorConfig();
  const startedAt = now().toISOString();
  const begun = repository.begin({
    attemptId,
    exerciseRef,
    exerciseKind: trusted.exerciseKind,
    assetId: trusted.assetId,
    assetRevision: trusted.assetRevision,
    inputHash: sha256({ exerciseRef, learnerAnswer, previousAttemptId }),
    learnerAnswer,
    previousAttemptId,
    retryIndex: retryContext.retryIndex,
    learnerIdHash: sha256("local-default-learner"),
    promptVersion: USE_EVALUATION_PROMPT_VERSION,
    schemaVersion: USE_EVALUATION_SCHEMA_VERSION,
    provider: config.provider,
    model: config.model,
    startedAt,
  });
  if (!begun.created) return storedResult(begun.run, true, repository);

  const finalizeFallback = (
    status: TraceStatus,
    errorCode: string,
    feedback: StoredUseEvaluationRun["feedback"] = null,
  ) => {
    const teachingAction = selectTeachingAction({ evaluation: null, retryIndex: retryContext.retryIndex });
    const writeStartedAt = now().toISOString();
    const writeStarted = performance.now();
    steps.push(step("record_fallback", "db_write", writeStartedAt, writeStarted, status, { errorCodes: [errorCode] }));
    return storedResult(repository.finalize({
      attemptId,
      status,
      feedback,
      teachingAction,
      errorCode,
      steps,
      provider: config.provider,
      model: config.model,
      completedAt: now().toISOString(),
    }), false, repository);
  };

  if (!learnerAnswer.trim()) {
    const evaluation = buildEmptyAnswerEvaluation(attemptId);
    const feedback = mapEvaluationToFeedback(evaluation);
    const teachingAction = selectTeachingAction({
      evaluation,
      retryIndex: retryContext.retryIndex,
      previousHints: retryContext.previousHints,
    });
    const validationStartedAt = now().toISOString();
    const validationStarted = performance.now();
    steps.push(step("validate_evaluation", "validation", validationStartedAt, validationStarted, "empty_answer_short_circuit"));
    const writeStartedAt = now().toISOString();
    const writeStarted = performance.now();
    steps.push(step("record_evaluation", "db_write", writeStartedAt, writeStarted, "success"));
    return storedResult(repository.finalize({
      attemptId,
      status: "success",
      evaluation,
      feedback,
      teachingAction,
      steps,
      provider: "deterministic",
      model: "empty-answer-rule-v1",
      completedAt: now().toISOString(),
    }), false, repository);
  }

  const activeProvider = provider === undefined
    ? config.apiKey && config.model
      ? new DeepSeekChatUseEvaluator({ apiKey: config.apiKey, model: config.model })
      : null
    : provider;
  if (!activeProvider) return finalizeFallback("fallback", "PROVIDER_NOT_CONFIGURED");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? config.timeoutMs);
  const modelStartedAt = now().toISOString();
  const modelStarted = performance.now();
  try {
    let result = await activeProvider.evaluate(input, controller.signal);
    let totalInputTokens = result.inputTokens;
    let totalOutputTokens = result.outputTokens;
    steps.push(step("evaluate_answer", "model_call", modelStartedAt, modelStarted, "response_received"));

    let validationStartedAt = now().toISOString();
    let validationStarted = performance.now();
    if (
      result.promptVersion !== USE_EVALUATION_PROMPT_VERSION
      || result.schemaVersion !== USE_EVALUATION_SCHEMA_VERSION
    ) {
      steps.push(step("validate_evaluation", "validation", validationStartedAt, validationStarted, "invalid", {
        errorCodes: ["PROVIDER_CONTRACT_VERSION_MISMATCH"],
      }));
      return finalizeFallback("invalid_output", "PROVIDER_CONTRACT_VERSION_MISMATCH");
    }
    let validation = validateUseEvaluation(result.output, input);
    steps.push(step(
      "validate_evaluation",
      "validation",
      validationStartedAt,
      validationStarted,
      validation.valid ? "valid" : "invalid",
      validation.valid ? {} : { errorCodes: validation.errors },
    ));
    const shouldRetryInvalidEvidence = !validation.valid
      && validation.errors.length > 0
      && validation.errors.every((errorCode) => errorCode === "FABRICATED_EVIDENCE_SPAN");
    if (shouldRetryInvalidEvidence) {
      const repairStartedAt = now().toISOString();
      const repairStarted = performance.now();
      result = await activeProvider.evaluate(input, controller.signal);
      totalInputTokens = totalInputTokens === null && result.inputTokens === null
        ? null
        : (totalInputTokens ?? 0) + (result.inputTokens ?? 0);
      totalOutputTokens = totalOutputTokens === null && result.outputTokens === null
        ? null
        : (totalOutputTokens ?? 0) + (result.outputTokens ?? 0);
      steps.push(step("retry_invalid_evidence", "model_call", repairStartedAt, repairStarted, "response_received", {
        errorCodes: ["FABRICATED_EVIDENCE_SPAN"],
      }));
      validationStartedAt = now().toISOString();
      validationStarted = performance.now();
      if (
        result.promptVersion !== USE_EVALUATION_PROMPT_VERSION
        || result.schemaVersion !== USE_EVALUATION_SCHEMA_VERSION
      ) {
        steps.push(step("validate_evaluation", "validation", validationStartedAt, validationStarted, "invalid", {
          errorCodes: ["PROVIDER_CONTRACT_VERSION_MISMATCH"],
        }));
        return finalizeFallback("invalid_output", "PROVIDER_CONTRACT_VERSION_MISMATCH");
      }
      validation = validateUseEvaluation(result.output, input);
      steps.push(step(
        "validate_evaluation",
        "validation",
        validationStartedAt,
        validationStarted,
        validation.valid ? "valid" : "invalid",
        validation.valid ? {} : { errorCodes: validation.errors },
      ));
    }
    if (!validation.valid) return finalizeFallback("invalid_output", validation.errors[0] ?? "INVALID_OUTPUT");
    if (validation.evaluation.needs_review || validation.evaluation.confidence < config.confidenceThreshold) {
      return finalizeFallback("fallback", "LOW_CONFIDENCE_OR_REVIEW_REQUIRED");
    }

    const feedback = mapEvaluationToFeedback(validation.evaluation);
    const teachingAction = selectTeachingAction({
      evaluation: validation.evaluation,
      retryIndex: retryContext.retryIndex,
      previousHints: retryContext.previousHints,
    });
    const writeStartedAt = now().toISOString();
    const writeStarted = performance.now();
    steps.push(step("record_evaluation", "db_write", writeStartedAt, writeStarted, "success"));
    return storedResult(repository.finalize({
      attemptId,
      status: "success",
      evaluation: validation.evaluation,
      feedback,
      teachingAction,
      steps,
      provider: result.provider,
      model: result.model,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      completedAt: now().toISOString(),
    }), false, repository);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) throw error;
    const timedOut = controller.signal.aborted;
    const errorCode = timedOut
      ? "PROVIDER_TIMEOUT"
      : error instanceof UseEvaluatorProviderHttpError
        ? `PROVIDER_HTTP_${error.status}`
      : error instanceof SyntaxError
        ? "MALFORMED_PROVIDER_JSON"
        : "PROVIDER_ERROR";
    steps.push(step("evaluate_answer", "model_call", modelStartedAt, modelStarted, timedOut ? "timeout" : "error", {
      errorCodes: [errorCode],
    }));
    return finalizeFallback(timedOut ? "timeout" : error instanceof SyntaxError ? "invalid_output" : "error", errorCode);
  } finally {
    clearTimeout(timeout);
  }
}

export const evaluateCollocationUseAttempt = evaluateUseAttempt;

export { IdempotencyConflictError };
