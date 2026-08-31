import { describe, expect, it } from "vitest";
import { conclusionNextAction, validateGuidedWritingConclusionEvaluation, type GuidedWritingConclusionInputV1 } from "../../src/domain/writing/conclusion-evaluation";
import { fullEssayNextAction, validateGuidedWritingFullEssayEvaluation, type GuidedWritingFullEssayInputV1 } from "../../src/domain/writing/full-essay-evaluation";

const conclusionInput: GuidedWritingConclusionInputV1 = {
  schemaVersion: "guided-writing-conclusion-input.v1", draftId: "ab68bfa5-0c72-4bd1-a9cf-cda93c9f2327",
  sourceEssayId: "essay-1", prompt: "To what extent do you agree?", questionType: "opinion", requiredParts: ["state extent"],
  essayPosition: "I disagree.", introductionText: "Some people support this view. I disagree.",
  bodyPlan: [
    { key: "body_1", role: "support", mainPoint: "It harms access.", takeaway: "Access matters.", paragraphText: "It harms access." },
    { key: "body_2", role: "deepen", mainPoint: "It has wider costs.", takeaway: "The costs are shared.", paragraphText: "It has wider costs." },
  ], conclusionText: "Overall, these effects show that the proposal should not be adopted.",
};
const clearAxis = { status: "clear" as const, strength_en: "The saved position is closed consistently.", issue_type: null, evidence_span: null, feedback_en: "No new main idea is introduced." };

describe("Guided Writing essay closure contracts", () => {
  it("accepts a bounded conclusion observation and derives KEEP locally", () => {
    const result = validateGuidedWritingConclusionEvaluation({ schema_version: "guided-writing-conclusion-evaluation.v1", draft_id: conclusionInput.draftId, task_response: clearAxis, language: { ...clearAxis, strength_en: "The language is concise.", feedback_en: "The conclusion is natural.", severity: null }, confidence: .94, needs_review: false }, conclusionInput);
    expect(result.valid).toBe(true); if (result.valid) expect(conclusionNextAction(result.evaluation)).toBe("KEEP_CONCLUSION");
  });

  it("rejects conclusion evidence that is not exact learner text", () => {
    const result = validateGuidedWritingConclusionEvaluation({ schema_version: "guided-writing-conclusion-evaluation.v1", draft_id: conclusionInput.draftId, task_response: { status: "needs_revision", strength_en: null, issue_type: "new_main_idea", evidence_span: "model-written replacement", feedback_en: "A new claim appears." }, language: { ...clearAxis, strength_en: "The language is readable.", feedback_en: "No blocking language issue.", severity: null }, confidence: .8, needs_review: false }, conclusionInput);
    expect(result).toMatchObject({ valid: false });
  });

  it("keeps the full essay at three bounded axes and rejects invented evidence", () => {
    const input: GuidedWritingFullEssayInputV1 = { schemaVersion: "guided-writing-full-essay-input.v1", reviewId: "bb68bfa5-0c72-4bd1-a9cf-cda93c9f2327", prompt: { sourceEssayId: "essay-1", text: conclusionInput.prompt, questionType: "opinion", requiredParts: ["state extent"] }, essayPosition: conclusionInput.essayPosition, sections: { introduction: conclusionInput.introductionText, bodyOne: "It harms access.", bodyTwo: "It has wider costs.", conclusion: conclusionInput.conclusionText }, essayText: [conclusionInput.introductionText, "It harms access.", "It has wider costs.", conclusionInput.conclusionText].join("\n\n") };
    const evaluation = { schema_version: "guided-writing-full-essay-evaluation.v1", review_id: input.reviewId, task_response: clearAxis, coherence: { ...clearAxis, strength_en: "The four sections progress clearly.", feedback_en: "The paragraph roles remain distinct." }, language: { ...clearAxis, strength_en: "The language remains clear.", feedback_en: "No blocking language issue.", severity: null }, confidence: .91, needs_review: false };
    const valid = validateGuidedWritingFullEssayEvaluation(evaluation, input); expect(valid.valid).toBe(true); if (valid.valid) expect(fullEssayNextAction(valid.evaluation)).toBe("READY");
    const invalid = { ...evaluation, coherence: { status: "needs_revision", strength_en: null, issue_type: "progression", evidence_span: "a sentence the learner never wrote", feedback_en: "The progression breaks here." } };
    expect(validateGuidedWritingFullEssayEvaluation(invalid, input)).toMatchObject({ valid: false });
  });
});
