import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import evaluationSchema from "../../../schemas/guided-writing-paragraph-evaluation.schema.json";
import type { ArgumentGraph, GuidedWritingParagraphKey } from "./guided-writing-coach";
import type { EssayQuestionType } from "./task-analysis";

export const GUIDED_WRITING_PARAGRAPH_SCHEMA_VERSION = "guided-writing-paragraph-evaluation.v1" as const;
export const GUIDED_WRITING_PARAGRAPH_PROMPT_VERSION = "guided-writing-paragraph-v1.0" as const;

export type ParagraphLogicIssue =
  | "off_task"
  | "missing_main_point"
  | "missing_support"
  | "missing_development"
  | "unsupported_jump"
  | "list_without_development"
  | "overclaim"
  | "progression"
  | "repetition"
  | "weak_connection"
  | "takeaway_repetition"
  | "contradiction";

export type ParagraphLanguageIssue =
  | "meaning_unclear"
  | "grammar"
  | "spelling"
  | "collocation"
  | "word_choice"
  | "cohesion"
  | "sentence_combination"
  | "register"
  | "sentence_boundary";

export type ParagraphEvaluationAxis<TIssue extends string> = {
  status: "clear" | "needs_revision" | "cannot_judge";
  strength_en: string | null;
  issue_type: TIssue | null;
  evidence_span: string | null;
  feedback_en: string;
};

export type GuidedWritingParagraphEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_PARAGRAPH_SCHEMA_VERSION;
  draft_id: string;
  logic: ParagraphEvaluationAxis<ParagraphLogicIssue>;
  language: ParagraphEvaluationAxis<ParagraphLanguageIssue> & {
    severity: "minor" | "blocking" | null;
  };
  confidence: number;
  needs_review: boolean;
};

export type GuidedWritingParagraphInputV1 = {
  schemaVersion: "guided-writing-paragraph-input.v1";
  sessionId: string;
  draftId: string;
  prompt: {
    sourceEssayId: string;
    text: string;
    questionType: EssayQuestionType;
    requiredParts: string[];
    scopeMarkers: string[];
  };
  paragraph: {
    key: GuidedWritingParagraphKey;
    role: string;
    goal: string;
  };
  argumentGraph: ArgumentGraph;
  draftText: string;
};

export type GuidedWritingParagraphDraftView = {
  id: string;
  sessionId: string;
  paragraphKey: GuidedWritingParagraphKey;
  draftText: string;
  status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error";
  evaluation: GuidedWritingParagraphEvaluationV1 | null;
  model: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type GuidedWritingParagraphNextAction =
  | "KEEP_DRAFT"
  | "REVISE_LOGIC"
  | "REVISE_LANGUAGE"
  | "REVISE_BOTH"
  | "CANNOT_JUDGE";

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true });
addFormatsToAjv(ajv);
ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingParagraphEvaluationV1>(evaluationSchema);

function validateAxis(
  axis: ParagraphEvaluationAxis<string>,
  draftText: string,
  axisName: "LOGIC" | "LANGUAGE",
): string[] {
  const errors: string[] = [];
  if (axis.status === "clear" && axis.issue_type !== null) errors.push(`${axisName}_CLEAR_HAS_ISSUE`);
  if (axis.status === "needs_revision" && axis.issue_type === null) errors.push(`${axisName}_REVISION_MISSING_ISSUE`);
  if (axis.status === "cannot_judge" && axis.issue_type !== null) errors.push(`${axisName}_CANNOT_JUDGE_HAS_ISSUE`);
  if (axis.evidence_span !== null && !draftText.includes(axis.evidence_span)) errors.push(`${axisName}_EVIDENCE_NOT_IN_DRAFT`);
  return errors;
}

export function validateGuidedWritingParagraphEvaluation(
  value: unknown,
  input: GuidedWritingParagraphInputV1,
): { valid: true; evaluation: GuidedWritingParagraphEvaluationV1 } | { valid: false; errors: string[] } {
  if (!validateSchema(value)) {
    return { valid: false, errors: (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  }
  const evaluation = value as GuidedWritingParagraphEvaluationV1;
  const errors = [
    ...(evaluation.draft_id === input.draftId ? [] : ["DRAFT_ID_MISMATCH"]),
    ...validateAxis(evaluation.logic, input.draftText, "LOGIC"),
    ...validateAxis(evaluation.language, input.draftText, "LANGUAGE"),
  ];
  if (evaluation.language.status === "clear" && evaluation.language.severity !== null) {
    errors.push("LANGUAGE_CLEAR_HAS_SEVERITY");
  }
  if (evaluation.language.status === "needs_revision" && evaluation.language.severity === null) {
    errors.push("LANGUAGE_REVISION_MISSING_SEVERITY");
  }
  if (evaluation.language.status === "cannot_judge" && evaluation.language.severity !== null) {
    errors.push("LANGUAGE_CANNOT_JUDGE_HAS_SEVERITY");
  }
  return errors.length ? { valid: false, errors } : { valid: true, evaluation };
}

export function paragraphNextAction(evaluation: GuidedWritingParagraphEvaluationV1): GuidedWritingParagraphNextAction {
  if (evaluation.logic.status === "cannot_judge" || evaluation.language.status === "cannot_judge") return "CANNOT_JUDGE";
  if (evaluation.logic.status === "clear" && evaluation.language.status === "clear") return "KEEP_DRAFT";
  if (evaluation.logic.status === "needs_revision" && evaluation.language.status === "needs_revision") return "REVISE_BOTH";
  return evaluation.logic.status === "needs_revision" ? "REVISE_LOGIC" : "REVISE_LANGUAGE";
}

export const guidedWritingParagraphEvaluationSchema = evaluationSchema;
