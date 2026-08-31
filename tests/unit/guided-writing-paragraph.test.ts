import { describe, expect, it } from "vitest";
import {
  paragraphNextAction,
  validateGuidedWritingParagraphEvaluation,
  type GuidedWritingParagraphEvaluationV1,
  type GuidedWritingParagraphInputV1,
} from "../../src/domain/writing/paragraph-evaluation";

const draftText = "Companies affect people beyond their shareholders, so they should consider social costs as well as profit.";
const input: GuidedWritingParagraphInputV1 = {
  schemaVersion: "guided-writing-paragraph-input.v1",
  sessionId: "a74c9c18-4a60-4df4-84f5-87705df158ad",
  draftId: "1fed4bf0-f3e2-48aa-bd55-799df0a2fc72",
  prompt: {
    sourceEssayId: "0bbea91d-c006-5f3f-a74e-6b51761cfa01",
    text: "Businesses have social responsibilities. To what extent do you agree or disagree?",
    questionType: "opinion",
    requiredParts: ["State a position"],
    scopeMarkers: ["to what extent"],
  },
  paragraph: { key: "body_1", role: "Support the position", goal: "Develop one reason." },
  argumentGraph: Object.fromEntries(["stance", "claim", "reason", "mechanism", "result"].map((node, index) => [node, {
    content: `Learner-owned ${node}`,
    origin: "user_after_question",
    turnId: `00000000-0000-4000-8000-00000000000${index}`,
  }])) as GuidedWritingParagraphInputV1["argumentGraph"],
  draftText,
};

function evaluation(): GuidedWritingParagraphEvaluationV1 {
  return {
    schema_version: "guided-writing-paragraph-evaluation.v1",
    draft_id: input.draftId,
    logic: {
      status: "clear",
      strength_en: "The paragraph maintains one relevant line of reasoning.",
      issue_type: null,
      evidence_span: null,
      feedback_en: "The main point is supported and reaches a proportionate conclusion.",
    },
    language: {
      status: "needs_revision",
      strength_en: "The intended meaning remains clear.",
      issue_type: "grammar",
      severity: "minor",
      evidence_span: "they should consider social costs",
      feedback_en: "One local grammar detail needs correction.",
    },
    confidence: 0.91,
    needs_review: false,
  };
}

describe("Guided Writing paragraph evaluation", () => {
  it("accepts separate logic and language observations and derives a bounded next action", () => {
    const result = validateGuidedWritingParagraphEvaluation(evaluation(), input);
    expect(result).toMatchObject({ valid: true });
    expect(paragraphNextAction(evaluation())).toBe("REVISE_LANGUAGE");
  });

  it("rejects evidence that was not copied exactly from the learner draft", () => {
    const value = evaluation();
    value.language.evidence_span = "they should considers social costs";
    expect(validateGuidedWritingParagraphEvaluation(value, input)).toEqual({
      valid: false,
      errors: ["LANGUAGE_EVIDENCE_NOT_IN_DRAFT"],
    });
  });

  it("rejects a clear axis that still reports an issue or severity", () => {
    const value = evaluation();
    value.language.status = "clear";
    expect(validateGuidedWritingParagraphEvaluation(value, input)).toEqual({
      valid: false,
      errors: ["LANGUAGE_CLEAR_HAS_ISSUE", "LANGUAGE_CLEAR_HAS_SEVERITY"],
    });
  });
});
