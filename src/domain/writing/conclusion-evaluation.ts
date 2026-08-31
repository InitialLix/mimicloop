import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import evaluationSchema from "../../../schemas/guided-writing-conclusion-evaluation.schema.json";
import type { EssayQuestionType } from "./task-analysis";
import type { IntroductionEvaluationAxis, IntroductionLanguageIssue } from "./introduction-evaluation";

export const GUIDED_WRITING_CONCLUSION_SCHEMA_VERSION = "guided-writing-conclusion-evaluation.v1" as const;
export const GUIDED_WRITING_CONCLUSION_PROMPT_VERSION = "guided-writing-conclusion-v1.0" as const;

export type ConclusionTaskIssue = "position_missing" | "position_inconsistent" | "body_map_inconsistent" | "new_main_idea" | "unsupported_claim" | "incomplete_response" | "repetition" | "overclaim";
export type GuidedWritingConclusionEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_CONCLUSION_SCHEMA_VERSION;
  draft_id: string;
  task_response: IntroductionEvaluationAxis<ConclusionTaskIssue>;
  language: IntroductionEvaluationAxis<IntroductionLanguageIssue> & { severity: "minor" | "blocking" | null };
  confidence: number;
  needs_review: boolean;
};
export type GuidedWritingConclusionContext = {
  sourceEssayId: string;
  prompt: string;
  questionType: EssayQuestionType;
  essayPosition: string;
  introductionText: string;
  bodyPlan: Array<{ key: "body_1" | "body_2"; role: string; mainPoint: string; takeaway: string; paragraphText: string }>;
};
export type GuidedWritingConclusionInputV1 = GuidedWritingConclusionContext & {
  schemaVersion: "guided-writing-conclusion-input.v1";
  draftId: string;
  requiredParts: string[];
  conclusionText: string;
};
export type GuidedWritingConclusionDraftView = {
  id: string; sourceEssayId: string; introductionDraftId: string; bodyOneDraftId: string; bodyTwoDraftId: string;
  conclusionText: string; status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error";
  evaluation: GuidedWritingConclusionEvaluationV1 | null; model: string | null; errorCode: string | null; createdAt: string; completedAt: string | null;
};
export type GuidedWritingConclusionNextAction = "KEEP_CONCLUSION" | "REVISE_TASK_RESPONSE" | "REVISE_LANGUAGE" | "REVISE_BOTH" | "CANNOT_JUDGE";

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true }); addFormatsToAjv(ajv); ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingConclusionEvaluationV1>(evaluationSchema);
function validateAxis(axis: IntroductionEvaluationAxis<string>, text: string, name: string) {
  const errors: string[] = [];
  if (axis.status === "clear" && axis.issue_type !== null) errors.push(`${name}_CLEAR_HAS_ISSUE`);
  if (axis.status === "needs_revision" && axis.issue_type === null) errors.push(`${name}_REVISION_MISSING_ISSUE`);
  if (axis.status === "cannot_judge" && axis.issue_type !== null) errors.push(`${name}_CANNOT_JUDGE_HAS_ISSUE`);
  if (axis.evidence_span !== null && !text.includes(axis.evidence_span)) errors.push(`${name}_EVIDENCE_NOT_IN_DRAFT`);
  return errors;
}
export function validateGuidedWritingConclusionEvaluation(value: unknown, input: GuidedWritingConclusionInputV1) {
  if (!validateSchema(value)) return { valid: false as const, errors: (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  const evaluation = value as GuidedWritingConclusionEvaluationV1;
  const errors = [
    ...(evaluation.draft_id === input.draftId ? [] : ["DRAFT_ID_MISMATCH"]),
    ...validateAxis(evaluation.task_response, input.conclusionText, "TASK_RESPONSE"),
    ...validateAxis(evaluation.language, input.conclusionText, "LANGUAGE"),
  ];
  if (evaluation.language.status === "clear" && evaluation.language.severity !== null) errors.push("LANGUAGE_CLEAR_HAS_SEVERITY");
  if (evaluation.language.status === "needs_revision" && evaluation.language.severity === null) errors.push("LANGUAGE_REVISION_MISSING_SEVERITY");
  if (evaluation.language.status === "cannot_judge" && evaluation.language.severity !== null) errors.push("LANGUAGE_CANNOT_JUDGE_HAS_SEVERITY");
  return errors.length ? { valid: false as const, errors } : { valid: true as const, evaluation };
}
export function conclusionNextAction(evaluation: GuidedWritingConclusionEvaluationV1): GuidedWritingConclusionNextAction {
  if (evaluation.task_response.status === "cannot_judge" || evaluation.language.status === "cannot_judge") return "CANNOT_JUDGE";
  if (evaluation.task_response.status === "clear" && evaluation.language.status === "clear") return "KEEP_CONCLUSION";
  if (evaluation.task_response.status === "needs_revision" && evaluation.language.status === "needs_revision") return "REVISE_BOTH";
  return evaluation.task_response.status === "needs_revision" ? "REVISE_TASK_RESPONSE" : "REVISE_LANGUAGE";
}
export const guidedWritingConclusionEvaluationSchema = evaluationSchema;
