import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import evaluationSchema from "../../../schemas/guided-writing-introduction-evaluation.schema.json";
import type { EssayQuestionType } from "./task-analysis";

export const GUIDED_WRITING_INTRODUCTION_SCHEMA_VERSION = "guided-writing-introduction-evaluation.v1" as const;
export const GUIDED_WRITING_INTRODUCTION_PROMPT_VERSION = "guided-writing-introduction-v1.0" as const;

export type IntroductionComponents = {
  opening: string;
  taskFraming: string;
  thesis: string;
};

export type IntroductionTaskIssue =
  | "task_framing"
  | "thesis_missing"
  | "position_inconsistent"
  | "body_map_inconsistent"
  | "irrelevant_opening"
  | "generic_opening"
  | "unsupported_claim"
  | "incomplete_response"
  | "repetition";

export type IntroductionLanguageIssue =
  | "meaning_unclear"
  | "grammar"
  | "spelling"
  | "collocation"
  | "word_choice"
  | "cohesion"
  | "register"
  | "sentence_boundary";

export type IntroductionEvaluationAxis<TIssue extends string> = {
  status: "clear" | "needs_revision" | "cannot_judge";
  strength_en: string | null;
  issue_type: TIssue | null;
  evidence_span: string | null;
  feedback_en: string;
};

export type GuidedWritingIntroductionEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_INTRODUCTION_SCHEMA_VERSION;
  draft_id: string;
  task_response: IntroductionEvaluationAxis<IntroductionTaskIssue>;
  language: IntroductionEvaluationAxis<IntroductionLanguageIssue> & {
    severity: "minor" | "blocking" | null;
  };
  confidence: number;
  needs_review: boolean;
};

export type GuidedWritingIntroductionInputV1 = {
  schemaVersion: "guided-writing-introduction-input.v1";
  draftId: string;
  prompt: {
    sourceEssayId: string;
    text: string;
    questionType: EssayQuestionType;
    requiredParts: string[];
  };
  essayPosition: string;
  bodyPlan: Array<{
    key: "body_1" | "body_2";
    role: string;
    mainPoint: string;
    paragraphText: string;
  }>;
  components: IntroductionComponents;
  draftText: string;
};

export type GuidedWritingIntroductionDraftView = {
  id: string;
  sourceEssayId: string;
  bodyOneSessionId: string;
  bodyTwoSessionId: string;
  components: IntroductionComponents;
  draftText: string;
  status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error";
  evaluation: GuidedWritingIntroductionEvaluationV1 | null;
  model: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type GuidedWritingIntroductionContext = {
  sourceEssayId: string;
  prompt: string;
  questionType: EssayQuestionType;
  essayPosition: string;
  bodyPlan: Array<{ key: "body_1" | "body_2"; role: string; mainPoint: string }>;
};

export type GuidedWritingIntroductionNextAction =
  | "KEEP_INTRODUCTION"
  | "REVISE_TASK_RESPONSE"
  | "REVISE_LANGUAGE"
  | "REVISE_BOTH"
  | "CANNOT_JUDGE";

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true });
addFormatsToAjv(ajv);
ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingIntroductionEvaluationV1>(evaluationSchema);

function validateAxis(axis: IntroductionEvaluationAxis<string>, draftText: string, name: string) {
  const errors: string[] = [];
  if (axis.status === "clear" && axis.issue_type !== null) errors.push(`${name}_CLEAR_HAS_ISSUE`);
  if (axis.status === "needs_revision" && axis.issue_type === null) errors.push(`${name}_REVISION_MISSING_ISSUE`);
  if (axis.status === "cannot_judge" && axis.issue_type !== null) errors.push(`${name}_CANNOT_JUDGE_HAS_ISSUE`);
  if (axis.evidence_span !== null && !draftText.includes(axis.evidence_span)) errors.push(`${name}_EVIDENCE_NOT_IN_DRAFT`);
  return errors;
}

export function validateGuidedWritingIntroductionEvaluation(
  value: unknown,
  input: GuidedWritingIntroductionInputV1,
): { valid: true; evaluation: GuidedWritingIntroductionEvaluationV1 } | { valid: false; errors: string[] } {
  if (!validateSchema(value)) {
    return { valid: false, errors: (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  }
  const evaluation = value as GuidedWritingIntroductionEvaluationV1;
  const errors = [
    ...(evaluation.draft_id === input.draftId ? [] : ["DRAFT_ID_MISMATCH"]),
    ...validateAxis(evaluation.task_response, input.draftText, "TASK_RESPONSE"),
    ...validateAxis(evaluation.language, input.draftText, "LANGUAGE"),
  ];
  if (evaluation.language.status === "clear" && evaluation.language.severity !== null) errors.push("LANGUAGE_CLEAR_HAS_SEVERITY");
  if (evaluation.language.status === "needs_revision" && evaluation.language.severity === null) errors.push("LANGUAGE_REVISION_MISSING_SEVERITY");
  if (evaluation.language.status === "cannot_judge" && evaluation.language.severity !== null) errors.push("LANGUAGE_CANNOT_JUDGE_HAS_SEVERITY");
  return errors.length ? { valid: false, errors } : { valid: true, evaluation };
}

export function introductionNextAction(
  evaluation: GuidedWritingIntroductionEvaluationV1,
): GuidedWritingIntroductionNextAction {
  if (evaluation.task_response.status === "cannot_judge" || evaluation.language.status === "cannot_judge") return "CANNOT_JUDGE";
  if (evaluation.task_response.status === "clear" && evaluation.language.status === "clear") return "KEEP_INTRODUCTION";
  if (evaluation.task_response.status === "needs_revision" && evaluation.language.status === "needs_revision") return "REVISE_BOTH";
  return evaluation.task_response.status === "needs_revision" ? "REVISE_TASK_RESPONSE" : "REVISE_LANGUAGE";
}

export const guidedWritingIntroductionEvaluationSchema = evaluationSchema;
