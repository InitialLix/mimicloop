import { describe, expect, it } from "vitest";
import {
  normalizeTask2Prompt,
  validateImportedTask2PromptAnalysis,
} from "../../src/domain/writing/imported-task2-prompt";

describe("Imported IELTS Task 2 prompt contract", () => {
  const analysisId = "7ea8d605-c8ad-4adb-9138-8780d5ef95a2";
  it("accepts one bounded classification that the learner can confirm", () => {
    expect(validateImportedTask2PromptAnalysis({
      schema_version: "guided-writing-task2-prompt-analysis.v1", analysis_id: analysisId,
      is_task_2: true, question_type: "discussion", topic: "science_space_ethics",
      reason_zh: "题目明确要求讨论双方观点并给出自己的意见。", confidence: .94, needs_review: false,
    }, analysisId)).toMatchObject({ valid: true });
  });
  it("rejects a non-Task-2 result that still assigns a writing type", () => {
    expect(validateImportedTask2PromptAnalysis({
      schema_version: "guided-writing-task2-prompt-analysis.v1", analysis_id: analysisId,
      is_task_2: false, question_type: "opinion", topic: null,
      reason_zh: "这不是 Task 2。", confidence: .9, needs_review: false,
    }, analysisId)).toMatchObject({ valid: false });
  });
  it("normalizes pasted whitespace without changing wording", () => {
    expect(normalizeTask2Prompt("  Some people  agree.\r\n\r\n\r\n Discuss both views.  ")).toBe("Some people agree.\n\nDiscuss both views.");
  });
});
