import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import evaluationSchema from "../../../schemas/guided-writing-node-language-evaluation.schema.json";
import type { ArgumentGraph, GuidedWritingParagraphKey } from "./guided-writing-coach";
import type { WritingLanguageNode, WritingTransferUnit } from "./learned-expression-retrieval";
import type { EssayQuestionType } from "./task-analysis";

export const GUIDED_WRITING_NODE_LANGUAGE_SCHEMA_VERSION = "guided-writing-node-language-evaluation.v1" as const;
export const GUIDED_WRITING_NODE_LANGUAGE_PROMPT_VERSION = "guided-writing-node-language-v1.0" as const;
export type NodeHintLevel = 0 | 1 | 2 | 3 | 4;

export type GuidedWritingNodeLanguageInputV1 = {
  schemaVersion: "guided-writing-node-language-input.v1";
  sessionId: string;
  attemptId: string;
  prompt: {
    sourceEssayId: string;
    text: string;
    questionType: EssayQuestionType;
  };
  paragraph: { key: GuidedWritingParagraphKey; role: string; goal: string };
  node: WritingLanguageNode;
  plannedMeaning: string;
  argumentGraph: ArgumentGraph;
  learnerText: string;
  assistance: {
    hintLevel: NodeHintLevel;
    targetWasShown: boolean;
  };
  targetAsset: null | {
    id: string;
    assetType: "sentence" | "collocation";
    transferUnit: WritingTransferUnit;
    englishForm: string;
  };
};

export type GuidedWritingNodeLanguageEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_NODE_LANGUAGE_SCHEMA_VERSION;
  attempt_id: string;
  verdict: "pass" | "retry" | "cannot_judge";
  dimensions: {
    meaning: "complete" | "partial" | "missing" | "cannot_judge";
    logic: "fits_node" | "incomplete" | "off_role" | "contradictory" | "cannot_judge";
    target_usage: "natural" | "used_with_error" | "not_used" | "not_required" | "cannot_judge";
    naturalness: "natural" | "mostly_natural" | "awkward" | "unclear" | "cannot_judge";
  };
  errors: Array<{
    dimension: "meaning" | "logic" | "target_usage" | "naturalness" | "grammar" | "spelling";
    severity: "minor" | "blocking";
    span: string | null;
    message_en: string;
  }>;
  accepted_text: string | null;
  feedback_en: string;
  minimal_hint_en: string | null;
  confidence: number;
  needs_review: boolean;
};

export type GuidedWritingNodeLanguageAttemptView = {
  id: string;
  sessionId: string;
  node: WritingLanguageNode;
  learnerText: string;
  assetType: "sentence" | "collocation" | null;
  assetId: string | null;
  hintLevel: NodeHintLevel;
  status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error";
  evaluation: GuidedWritingNodeLanguageEvaluationV1 | null;
  model: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type RestoredNodeLanguageWork = {
  drafts: Partial<Record<WritingLanguageNode, string>>;
  hintLevels: Partial<Record<WritingLanguageNode, NodeHintLevel>>;
  messages: Partial<Record<WritingLanguageNode, string>>;
  nextNode: WritingLanguageNode | null;
  allNodesPassed: boolean;
};

const paragraphLanguageNodes: WritingLanguageNode[] = ["claim", "reason", "mechanism", "result"];

function savedAttemptMessage(attempt: GuidedWritingNodeLanguageAttemptView) {
  if (attempt.evaluation || attempt.status === "pending" || attempt.status === "success") return null;
  if (attempt.errorCode === "PROVIDER_NETWORK_ERROR") {
    return "DeepSeek was unavailable. This saved draft has been restored; you can edit it or try checking again.";
  }
  if (attempt.errorCode === "MODEL_TIMEOUT" || attempt.status === "timeout") {
    return "The previous check timed out. This saved draft has been restored; you can try again.";
  }
  return "The previous check could not be completed. This saved draft has been restored and remains editable.";
}

export function restoreNodeLanguageWork(
  attempts: GuidedWritingNodeLanguageAttemptView[],
): RestoredNodeLanguageWork {
  const latest = new Map<WritingLanguageNode, GuidedWritingNodeLanguageAttemptView>();
  for (const attempt of [...attempts].sort((left, right) => (
    left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  ))) {
    latest.set(attempt.node, attempt);
  }
  const restored: RestoredNodeLanguageWork = {
    drafts: {},
    hintLevels: {},
    messages: {},
    nextNode: null,
    allNodesPassed: false,
  };
  for (const [node, attempt] of latest) {
    restored.drafts[node] = attempt.learnerText;
    restored.hintLevels[node] = attempt.hintLevel;
    const message = savedAttemptMessage(attempt);
    if (message) restored.messages[node] = message;
  }
  restored.nextNode = paragraphLanguageNodes.find((node) => latest.get(node)?.evaluation?.verdict !== "pass") ?? null;
  restored.allNodesPassed = restored.nextNode === null;
  return restored;
}

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true });
addFormatsToAjv(ajv);
ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingNodeLanguageEvaluationV1>(evaluationSchema);

export function validateGuidedWritingNodeLanguageEvaluation(
  value: unknown,
  input: GuidedWritingNodeLanguageInputV1,
): { valid: true; evaluation: GuidedWritingNodeLanguageEvaluationV1 } | { valid: false; errors: string[] } {
  if (!validateSchema(value)) {
    return { valid: false, errors: (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  }
  const evaluation = value as GuidedWritingNodeLanguageEvaluationV1;
  const errors: string[] = [];
  if (evaluation.attempt_id !== input.attemptId) errors.push("ATTEMPT_ID_MISMATCH");
  for (const issue of evaluation.errors) {
    if (issue.span !== null && !input.learnerText.includes(issue.span)) errors.push("ERROR_SPAN_NOT_IN_LEARNER_TEXT");
  }
  const targetRequired = input.assistance.targetWasShown && input.targetAsset !== null;
  if (!targetRequired && evaluation.dimensions.target_usage !== "not_required" && evaluation.verdict !== "cannot_judge") {
    errors.push("UNSHOWN_TARGET_MUST_BE_NOT_REQUIRED");
  }
  if (targetRequired && evaluation.verdict === "pass" && evaluation.dimensions.target_usage !== "natural") {
    errors.push("PASS_REQUIRES_NATURAL_TARGET");
  }
  if (evaluation.verdict === "pass") {
    if (evaluation.dimensions.meaning !== "complete") errors.push("PASS_REQUIRES_COMPLETE_MEANING");
    if (evaluation.dimensions.logic !== "fits_node") errors.push("PASS_REQUIRES_NODE_LOGIC");
    if (!["natural", "mostly_natural"].includes(evaluation.dimensions.naturalness)) errors.push("PASS_REQUIRES_NATURAL_LANGUAGE");
    if (evaluation.errors.some((issue) => issue.severity === "blocking")) errors.push("PASS_HAS_BLOCKING_ERROR");
    if (evaluation.accepted_text !== input.learnerText) errors.push("PASS_ACCEPTED_TEXT_MUST_EQUAL_LEARNER_TEXT");
  } else if (evaluation.accepted_text !== null) {
    errors.push("NON_PASS_HAS_ACCEPTED_TEXT");
  }
  return errors.length ? { valid: false, errors } : { valid: true, evaluation };
}

export function nodeLanguageOrigin(hintLevel: NodeHintLevel) {
  if (hintLevel === 0) return "independent" as const;
  if (hintLevel === 1) return "after_concept_cue" as const;
  if (hintLevel === 2) return "after_target_expression" as const;
  if (hintLevel === 3) return "after_partial_frame" as const;
  return "after_full_reference" as const;
}

export const guidedWritingNodeLanguageEvaluationSchema = evaluationSchema;
