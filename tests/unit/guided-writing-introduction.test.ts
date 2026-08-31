import { describe, expect, it } from "vitest";
import {
  introductionNextAction,
  validateGuidedWritingIntroductionEvaluation,
  type GuidedWritingIntroductionEvaluationV1,
  type GuidedWritingIntroductionInputV1,
} from "../../src/domain/writing/introduction-evaluation";
import { introductionLanguageNeed } from "../../src/domain/writing/introduction-language-activation";

const input: GuidedWritingIntroductionInputV1 = {
  schemaVersion: "guided-writing-introduction-input.v1",
  draftId: "cd68bfa5-0c72-4bd1-a9cf-cda93c9f2327",
  prompt: {
    sourceEssayId: "essay-1",
    text: "Some people think X. To what extent do you agree or disagree?",
    questionType: "opinion",
    requiredParts: ["表达同意或不同意的程度"],
  },
  essayPosition: "I largely disagree with this view.",
  bodyPlan: [
    { key: "body_1", role: "支持立场", mainPoint: "The policy creates unequal access.", paragraphText: "Body one." },
    { key: "body_2", role: "深化或限定立场", mainPoint: "Its benefits remain limited.", paragraphText: "Body two." },
  ],
  components: {
    opening: "The issue remains widely debated.",
    taskFraming: "Some people support the proposed policy.",
    thesis: "I largely disagree because it creates unequal access and offers limited benefits.",
  },
  draftText: "The issue remains widely debated. Some people support the proposed policy. I largely disagree because it creates unequal access and offers limited benefits.",
};

function clearEvaluation(): GuidedWritingIntroductionEvaluationV1 {
  return {
    schema_version: "guided-writing-introduction-evaluation.v1" as const,
    draft_id: input.draftId,
    task_response: {
      status: "clear" as const,
      strength_en: "The thesis is consistent with the completed body paragraphs.",
      issue_type: null,
      evidence_span: null,
      feedback_en: "The task is framed accurately and the position is clear.",
    },
    language: {
      status: "clear" as const,
      strength_en: "The language is concise and formal.",
      issue_type: null,
      severity: null,
      evidence_span: null,
      feedback_en: "The introduction is natural and readable.",
    },
    confidence: 0.93,
    needs_review: false,
  };
}

describe("Guided Writing Introduction evaluation", () => {
  it("keeps the three introduction language jobs distinct", () => {
    expect(introductionLanguageNeed("opening")).toMatchObject({ label: "Relevant opening" });
    expect(introductionLanguageNeed("task_framing").preferredArgumentFunctions).toContain("paraphrase_prompt");
    expect(introductionLanguageNeed("thesis").preferredArgumentFunctions).toContain("state_position");
  });

  it("accepts a validated two-axis observation and derives the next action locally", () => {
    const validation = validateGuidedWritingIntroductionEvaluation(clearEvaluation(), input);
    expect(validation).toMatchObject({ valid: true });
    if (validation.valid) expect(introductionNextAction(validation.evaluation)).toBe("KEEP_INTRODUCTION");
  });

  it("rejects feedback evidence that was not copied from the learner introduction", () => {
    const evaluation = clearEvaluation();
    evaluation.task_response = {
      status: "needs_revision",
      strength_en: null,
      issue_type: "position_inconsistent",
      evidence_span: "A corrected sentence supplied by the model.",
      feedback_en: "The thesis does not match the saved position.",
    };
    const validation = validateGuidedWritingIntroductionEvaluation(evaluation, input);
    expect(validation).toMatchObject({ valid: false });
    if (!validation.valid) expect(validation.errors).toContain("TASK_RESPONSE_EVIDENCE_NOT_IN_DRAFT");
  });
});
