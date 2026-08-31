import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import evaluationSchema from "../../../schemas/guided-writing-full-essay-evaluation.schema.json";
import type { EssayQuestionType } from "./task-analysis";
import type { IntroductionEvaluationAxis, IntroductionLanguageIssue } from "./introduction-evaluation";

export const GUIDED_WRITING_FULL_ESSAY_SCHEMA_VERSION = "guided-writing-full-essay-evaluation.v1" as const;
export const GUIDED_WRITING_FULL_ESSAY_PROMPT_VERSION = "guided-writing-full-essay-v1.0" as const;
export type FullEssayTaskIssue = "incomplete_response" | "position_inconsistent" | "body_map_inconsistent" | "off_task" | "unsupported_claim";
export type FullEssayCoherenceIssue = "progression" | "cross_paragraph_repetition" | "weak_transition" | "paragraph_role_overlap" | "introduction_body_mismatch" | "conclusion_mismatch";
export type GuidedWritingFullEssayEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_FULL_ESSAY_SCHEMA_VERSION; review_id: string;
  task_response: IntroductionEvaluationAxis<FullEssayTaskIssue>;
  coherence: IntroductionEvaluationAxis<FullEssayCoherenceIssue>;
  language: IntroductionEvaluationAxis<IntroductionLanguageIssue> & { severity: "minor" | "blocking" | null };
  confidence: number; needs_review: boolean;
};
export type GuidedWritingFullEssayInputV1 = {
  schemaVersion: "guided-writing-full-essay-input.v1"; reviewId: string;
  prompt: { sourceEssayId: string; text: string; questionType: EssayQuestionType; requiredParts: string[] };
  essayPosition: string;
  sections: { introduction: string; bodyOne: string; bodyTwo: string; conclusion: string };
  essayText: string;
};
export type CorpusUseItem = { sessionId: string; node: string; assetType: "sentence" | "collocation"; assetId: string; label: string; hintLevel: number; learningState: "learned" | "new" };
export type GuidedWritingFullEssayContext = { sourceEssayId: string; prompt: string; essayPosition: string; sections: GuidedWritingFullEssayInputV1["sections"]; essayText: string; corpusUse: CorpusUseItem[] };
export type GuidedWritingFullEssayReviewView = { id: string; sourceEssayId: string; introductionDraftId: string; bodyOneDraftId: string; bodyTwoDraftId: string; conclusionDraftId: string; status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error"; evaluation: GuidedWritingFullEssayEvaluationV1 | null; model: string | null; errorCode: string | null; createdAt: string; completedAt: string | null };
export type GuidedWritingFullEssayNextAction = "READY" | "REVISE_TASK" | "REVISE_COHERENCE" | "REVISE_LANGUAGE" | "REVISE_MULTIPLE" | "CANNOT_JUDGE";

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true }); addFormatsToAjv(ajv); ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingFullEssayEvaluationV1>(evaluationSchema);
function validateAxis(axis: IntroductionEvaluationAxis<string>, text: string, name: string) {
  const errors: string[] = [];
  if (axis.status === "clear" && axis.issue_type !== null) errors.push(`${name}_CLEAR_HAS_ISSUE`);
  if (axis.status === "needs_revision" && axis.issue_type === null) errors.push(`${name}_REVISION_MISSING_ISSUE`);
  if (axis.status === "cannot_judge" && axis.issue_type !== null) errors.push(`${name}_CANNOT_JUDGE_HAS_ISSUE`);
  if (axis.evidence_span !== null && !text.includes(axis.evidence_span)) errors.push(`${name}_EVIDENCE_NOT_IN_ESSAY`);
  return errors;
}
export function validateGuidedWritingFullEssayEvaluation(value: unknown, input: GuidedWritingFullEssayInputV1) {
  if (!validateSchema(value)) return { valid: false as const, errors: (validateSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  const evaluation = value as GuidedWritingFullEssayEvaluationV1;
  const errors = [
    ...(evaluation.review_id === input.reviewId ? [] : ["REVIEW_ID_MISMATCH"]),
    ...validateAxis(evaluation.task_response, input.essayText, "TASK_RESPONSE"),
    ...validateAxis(evaluation.coherence, input.essayText, "COHERENCE"),
    ...validateAxis(evaluation.language, input.essayText, "LANGUAGE"),
  ];
  if (evaluation.language.status === "clear" && evaluation.language.severity !== null) errors.push("LANGUAGE_CLEAR_HAS_SEVERITY");
  if (evaluation.language.status === "needs_revision" && evaluation.language.severity === null) errors.push("LANGUAGE_REVISION_MISSING_SEVERITY");
  if (evaluation.language.status === "cannot_judge" && evaluation.language.severity !== null) errors.push("LANGUAGE_CANNOT_JUDGE_HAS_SEVERITY");
  return errors.length ? { valid: false as const, errors } : { valid: true as const, evaluation };
}
export function fullEssayNextAction(evaluation: GuidedWritingFullEssayEvaluationV1): GuidedWritingFullEssayNextAction {
  const statuses = [evaluation.task_response.status, evaluation.coherence.status, evaluation.language.status];
  if (statuses.includes("cannot_judge")) return "CANNOT_JUDGE";
  const needs = statuses.map((status, index) => status === "needs_revision" ? index : -1).filter((index) => index >= 0);
  if (needs.length === 0) return "READY";
  if (needs.length > 1) return "REVISE_MULTIPLE";
  return needs[0] === 0 ? "REVISE_TASK" : needs[0] === 1 ? "REVISE_COHERENCE" : "REVISE_LANGUAGE";
}
export const guidedWritingFullEssayEvaluationSchema = evaluationSchema;
