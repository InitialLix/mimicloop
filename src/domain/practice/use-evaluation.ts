import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import useEvaluationSchema from "../../../schemas/use-evaluation.schema.json";

export const USE_EVALUATION_SCHEMA_VERSION = "use-eval.v1" as const;
export const USE_EVALUATION_PROMPT_VERSION = "use-evaluator-v11" as const;

export type UseEvaluationInputV1 = {
  schemaVersion: "use-eval-input.v1";
  attemptId: string;
  exercise: {
    id: string;
    exerciseType: "sentence_use" | "collocation_use";
    instructionZh: string;
    intendedMeaningZh: string;
    targetAsset: {
      id: string;
      type: "sentence_pattern" | "collocation" | "fixed_phrase";
      canonicalText: string;
      acceptedVariants?: string[];
      commonErrors?: string[];
    };
    referenceAnswers: string[];
    allowedParaphrase: boolean;
  };
  learnerAnswer: string;
  context?: {
    topic?: string;
    priorHintLevel?: number;
    retryIndex?: number;
  };
};

export type UseEvaluationV1 = {
  schema_version: "use-eval.v1";
  attempt_id: string;
  verdict: "pass" | "retry" | "incomplete" | "cannot_judge";
  dimensions: {
    meaning: "complete" | "partial" | "missing" | "cannot_judge";
    target_expression: "natural" | "used_with_error" | "not_used" | "not_required" | "cannot_judge";
    grammar: "ok" | "minor_issue" | "major_issue" | "cannot_judge";
    collocation: "natural" | "awkward" | "incorrect" | "not_applicable" | "cannot_judge";
  };
  errors: Array<{
    type: "meaning" | "target_expression" | "grammar" | "collocation" | "word_choice" | "typo" | "spelling" | "other";
    severity: "non_blocking" | "blocking";
    span: string | null;
    message_zh: string;
  }>;
  positive_evidence: Array<{
    type: "meaning" | "target_expression" | "grammar" | "collocation";
    span: string | null;
    message_zh: string;
  }>;
  minimal_hint: null | {
    kind: "concept_cue" | "verb_cue" | "preposition_cue" | "partial_form" | "retry_instruction";
    text_zh: string;
  };
  confidence: number;
  needs_review: boolean;
};

export type UseEvaluationFeedback = {
  verdict: UseEvaluationV1["verdict"];
  meaningLabel: string;
  success: string | null;
  issue: string | null;
  issueType?: UseEvaluationV1["errors"][number]["type"] | null;
  issueSeverity?: UseEvaluationV1["errors"][number]["severity"] | null;
  surfaceNote?: string | null;
  typoOnly?: boolean;
  hint: string | null;
  needsReview: boolean;
};

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true });
addFormatsToAjv(ajv);
const validateSchema = ajv.compile<UseEvaluationV1>(useEvaluationSchema);

export function validateUseEvaluation(value: unknown, input: UseEvaluationInputV1) {
  const errors: string[] = [];
  if (!validateSchema(value)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `SCHEMA_${error.instancePath || "ROOT"}_${error.keyword}`));
    return { valid: false as const, errors };
  }

  const evaluation = value as UseEvaluationV1;
  if (evaluation.attempt_id !== input.attemptId) errors.push("ATTEMPT_ID_MISMATCH");
  for (const evidence of [...evaluation.errors, ...evaluation.positive_evidence]) {
    if (evidence.span !== null && !input.learnerAnswer.includes(evidence.span)) errors.push("FABRICATED_EVIDENCE_SPAN");
  }
  const hasBlockingError = evaluation.errors.some((error) => error.severity === "blocking");
  if (evaluation.errors.some((error) => error.type === "typo" && error.severity !== "non_blocking")) {
    errors.push("TYPO_CANNOT_BE_BLOCKING");
  }
  if (evaluation.verdict === "pass" && (
    evaluation.dimensions.meaning !== "complete"
    || evaluation.dimensions.target_expression !== "natural"
    || evaluation.dimensions.grammar === "major_issue"
    || evaluation.dimensions.collocation === "incorrect"
    || hasBlockingError
  )) errors.push("INVALID_PASS");
  if (evaluation.verdict === "pass" && evaluation.needs_review) errors.push("PASS_CANNOT_NEED_REVIEW");

  return errors.length
    ? { valid: false as const, errors: Array.from(new Set(errors)) }
    : { valid: true as const, evaluation, errors: [] };
}

export function mapEvaluationToFeedback(evaluation: UseEvaluationV1): UseEvaluationFeedback {
  const meaningLabels: Record<UseEvaluationV1["dimensions"]["meaning"], string> = {
    complete: "题意内容：完整",
    partial: "题意内容：部分覆盖",
    missing: "题意内容：核心缺失",
    cannot_judge: "题意内容：暂无法判断",
  };
  const primaryError = evaluation.errors.find((error) => error.severity === "blocking")
    ?? evaluation.errors.find((error) => error.type !== "typo")
    ?? evaluation.errors[0]
    ?? null;
  const typoOnly = evaluation.errors.length > 0
    && evaluation.errors.every((error) => error.type === "typo" && error.severity === "non_blocking");
  const separateTypo = evaluation.errors.find((error) => error.type === "typo" && error !== primaryError);
  return {
    verdict: evaluation.verdict,
    meaningLabel: meaningLabels[evaluation.dimensions.meaning],
    success: evaluation.positive_evidence[0]?.message_zh ?? null,
    issue: primaryError?.message_zh ?? null,
    issueType: primaryError?.type ?? null,
    issueSeverity: primaryError?.severity ?? null,
    surfaceNote: separateTypo?.message_zh ?? null,
    typoOnly,
    hint: evaluation.minimal_hint?.text_zh ?? null,
    needsReview: evaluation.needs_review,
  };
}

export function buildEmptyAnswerEvaluation(attemptId: string): UseEvaluationV1 {
  return {
    schema_version: USE_EVALUATION_SCHEMA_VERSION,
    attempt_id: attemptId,
    verdict: "incomplete",
    dimensions: {
      meaning: "missing",
      target_expression: "not_used",
      grammar: "cannot_judge",
      collocation: "cannot_judge",
    },
    errors: [{
      type: "meaning",
      severity: "blocking",
      span: null,
      message_zh: "还没有写下英文句子，暂时无法评价这次应用。",
    }],
    positive_evidence: [],
    minimal_hint: { kind: "retry_instruction", text_zh: "先尝试写出一个完整英文句子，再检查。" },
    confidence: 1,
    needs_review: false,
  };
}

export { useEvaluationSchema };
