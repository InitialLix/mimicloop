import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import analysisSchema from "../../../schemas/guided-writing-task2-prompt-analysis.schema.json";
import promptSchema from "../../../schemas/guided-writing-prompt.schema.json";
import type { EssayQuestionType, EssayTaskAnalysisV1 } from "./task-analysis";

export const TASK2_PROMPT_ANALYSIS_SCHEMA_VERSION = "guided-writing-task2-prompt-analysis.v1" as const;
export const TASK2_PROMPT_ANALYSIS_PROMPT_VERSION = "guided-writing-task2-prompt-analysis-v1.1" as const;
export const task2QuestionTypes: EssayQuestionType[] = [
  "opinion", "discussion", "advantages_disadvantages", "causes_solutions",
  "positive_negative_development", "two_part_multi_part",
];
export const task2QuestionTypeLabels: Record<EssayQuestionType, string> = {
  opinion: "同意程度 / 观点论证",
  discussion: "讨论双方观点并给出立场",
  advantages_disadvantages: "优缺点 / 利弊权衡",
  causes_solutions: "原因、问题与解决方案",
  positive_negative_development: "正面或负面发展",
  two_part_multi_part: "两个直接问题",
};
export const task2Topics = [
  "education_children", "technology_ai_digital_media", "environment_energy_animals",
  "health_diet_lifestyle", "government_public_policy_spending", "work_economy_business_consumption",
  "society_family_population_equality", "crime_law_punishment", "culture_art_language_media",
  "cities_housing_transport", "globalization_tourism_migration", "science_space_ethics",
] as const;
export type Task2Topic = typeof task2Topics[number];
export type ImportedTask2PromptAnalysisV1 = {
  schema_version: typeof TASK2_PROMPT_ANALYSIS_SCHEMA_VERSION;
  analysis_id: string;
  is_task_2: boolean;
  question_type: EssayQuestionType | null;
  topic: Task2Topic | null;
  reason_zh: string;
  confidence: number;
  needs_review: boolean;
};
export type ImportedTask2PromptRecord = {
  schema_version: "1.0.0"; record_kind: "guided_writing_prompt"; id: string; title: string;
  ielts_prompt: string; source_name: "Learner imported IELTS Task 2 prompt";
  content_role: "guided_writing_prompt"; source_type: "manual_text"; answer_origin: "user_authored";
  author: "Local learner"; question_type: EssayQuestionType; topics: [Task2Topic]; content_hash: string;
  analysis_id: string; created_at: string; updated_at: string;
};
export type ImportedTask2PromptAnalysisResult = {
  analysisId: string; prompt: string; status: "evaluated" | "fallback";
  analysis: ImportedTask2PromptAnalysisV1 | null; model: string | null; message: string | null;
};
export type ConfirmedImportedTask2Prompt = { prompt: EssayTaskAnalysisV1; created: boolean };

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true }); addFormatsToAjv(ajv); ajv.addSchema(commonSchema);
const validateAnalysisSchema = ajv.compile<ImportedTask2PromptAnalysisV1>(analysisSchema);
const validatePromptSchema = ajv.compile<ImportedTask2PromptRecord>(promptSchema);

export function normalizeTask2Prompt(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
export function validateImportedTask2PromptAnalysis(value: unknown, analysisId: string) {
  if (!validateAnalysisSchema(value)) return { valid: false as const, errors: (validateAnalysisSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  const analysis = value as ImportedTask2PromptAnalysisV1;
  const errors: string[] = [];
  if (analysis.analysis_id !== analysisId) errors.push("ANALYSIS_ID_MISMATCH");
  if (analysis.is_task_2 && !analysis.question_type) errors.push("TASK2_MISSING_QUESTION_TYPE");
  if (!analysis.is_task_2 && analysis.question_type !== null) errors.push("NON_TASK2_HAS_QUESTION_TYPE");
  if (!analysis.is_task_2 && analysis.topic !== null) errors.push("NON_TASK2_HAS_TOPIC");
  return errors.length ? { valid: false as const, errors } : { valid: true as const, analysis };
}
export function validateImportedTask2PromptRecord(value: unknown) {
  if (!validatePromptSchema(value)) return { valid: false as const, errors: (validatePromptSchema.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`) };
  return { valid: true as const, prompt: value as ImportedTask2PromptRecord };
}
export const importedTask2PromptAnalysisSchema = analysisSchema;
