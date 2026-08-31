import { describe, expect, it } from "vitest";
import {
  argumentNodeOrder,
  emptyArgumentGraph,
  guidanceForNode,
  isGuidedWritingEvaluationActionable,
  questionForNode,
  selectGuidedWritingChainAction,
  selectGuidedWritingCoachAction,
  validateGuidedWritingChainReview,
  validateGuidedWritingCoachEvaluation,
  type GuidedWritingChainReviewInputV1,
  type GuidedWritingChainReviewV1,
  type GuidedWritingCoachEvaluationV1,
  type GuidedWritingCoachInputV1,
} from "../../src/domain/writing/guided-writing-coach";

const input: GuidedWritingCoachInputV1 = {
  schemaVersion: "guided-writing-coach-input.v1",
  sessionId: "a74c9c18-4a60-4df4-84f5-87705df158ad",
  turnId: "1fed4bf0-f3e2-48aa-bd55-799df0a2fc72",
  prompt: {
    sourceEssayId: "0bbea91d-c006-5f3f-a74e-6b51761cfa01",
    text: "Businesses have social responsibilities. To what extent do you agree or disagree?",
    questionType: "opinion",
    requiredParts: ["State a position"],
    scopeMarkers: ["to what extent"],
  },
  paragraph: { key: "body_1", role: "Support the position", goal: "Develop one reason." },
  currentNode: "stance",
  developmentRelation: null,
  graph: emptyArgumentGraph(),
  questionEn: questionForNode("stance"),
  learnerAnswer: "I strongly agree that businesses should contribute to society.",
};

const accepted: GuidedWritingCoachEvaluationV1 = {
  schema_version: "guided-writing-coach.v1.2",
  turn_id: input.turnId,
  verdict: "accept",
  dimensions: { relevance: "direct", logic: "clear", specificity: "sufficient" },
  issue_type: null,
  development_relation: null,
  accepted_span: input.learnerAnswer,
  forward_span: null,
  feedback_en: "This states a clear position that directly answers the prompt.",
  confidence: 0.94,
  needs_review: false,
};

describe("Guided Writing English coach policy", () => {
  it("uses English-only questions across the learner-owned argument chain", () => {
    expect(argumentNodeOrder).toEqual(["stance", "claim", "reason", "mechanism", "result"]);
    for (const node of argumentNodeOrder) {
      expect(questionForNode(node)).not.toMatch(/[\u3400-\u9fff]/u);
      expect(questionForNode(node).endsWith("?") || questionForNode(node).endsWith(".")).toBe(true);
    }
  });

  it("makes the Claim question follow the trusted paragraph role for each essay type", () => {
    expect(questionForNode("claim", undefined, { questionType: "opinion" }))
      .toContain("support your overall position");
    expect(questionForNode("claim", undefined, { questionType: "discussion" }))
      .toContain("Why might a reasonable person hold the first view?");
    expect(questionForNode("claim", undefined, { questionType: "two_part_multi_part" }))
      .toContain("direct answer to the first question in the prompt");
    expect(guidanceForNode("claim", { questionType: "discussion" })).toMatchObject({
      taskEn: "Explain the strongest reason for the first view fairly.",
      boundaryEn: "You do not need to agree with it or refute it yet.",
    });
    expect(guidanceForNode("stance", { questionType: "discussion" })?.examplesEn).toHaveLength(2);
    expect(guidanceForNode("stance", { questionType: "discussion" })?.examplesEn[0])
      .toContain("Although both approaches");
    expect(questionForNode("reason", undefined, { questionType: "discussion" }))
      .toContain("fact, principle or condition");
    expect(questionForNode("mechanism", undefined, { questionType: "discussion" }))
      .toContain("missing connection");
    expect(questionForNode("result", undefined, { questionType: "discussion" }))
      .toContain("Do not give your own final rebuttal yet");
    expect(guidanceForNode("reason", { questionType: "discussion" })?.boundaryEn)
      .toContain("Do not restate the claim");
    expect(guidanceForNode("reason", { questionType: "discussion" })?.logicLens?.checksEn[2])
      .toContain("Sceptical-reader test");
    expect(guidanceForNode("mechanism", { questionType: "discussion" })?.taskEn)
      .toContain("missing connection");
    expect(guidanceForNode("result", { questionType: "discussion" })?.boundaryEn)
      .toContain("do not need to refute it");
  });

  it("gives Body Paragraph 2 a distinct role instead of repeating Body Paragraph 1", () => {
    expect(questionForNode("claim", undefined, { questionType: "opinion", paragraphKey: "body_2" }))
      .toContain("second supporting reason, a necessary qualification, or a limited concession");
    expect(questionForNode("claim", undefined, { questionType: "causes_solutions", paragraphKey: "body_2" }))
      .toContain("solution");
    expect(questionForNode("claim", undefined, { questionType: "two_part_multi_part", paragraphKey: "body_2" }))
      .toContain("second question");
    expect(guidanceForNode("claim", { questionType: "opinion", paragraphKey: "body_2" })).toMatchObject({
      taskEn: "Choose the job of Body Paragraph 2, then state one claim that performs it.",
    });
    expect(guidanceForNode("claim", { questionType: "opinion", paragraphKey: "body_2" })?.boundaryEn)
      .toContain("Do not repeat Body Paragraph 1");
    expect(guidanceForNode("reason", { questionType: "discussion", paragraphKey: "body_2" })?.taskEn)
      .toContain("second view");
    expect(questionForNode("result", undefined, { questionType: "discussion", paragraphKey: "body_2" }))
      .toContain("saved overall position");
    expect(guidanceForNode("result", { questionType: "discussion", paragraphKey: "body_2" })?.boundaryEn)
      .toContain("limited judgment consistent with your saved overall position");
    expect(guidanceForNode("result", { questionType: "discussion", paragraphKey: "body_2" })?.boundaryEn)
      .toContain("Do not add a new reason");
  });

  it("accepts a valid observation and deterministically chooses the next question", () => {
    const validation = validateGuidedWritingCoachEvaluation(accepted, input);
    expect(validation.valid).toBe(true);
    expect(selectGuidedWritingCoachAction("stance", accepted, { questionType: "opinion" })).toEqual({
      type: "ACCEPT_AND_CONTINUE",
      nextNode: "claim",
      nextQuestionEn: questionForNode("claim", undefined, { questionType: "opinion" }),
      developmentRelation: null,
      chainReview: null,
      reuseSuggestion: null,
    });
    expect(selectGuidedWritingCoachAction("result", accepted)).toEqual({
      type: "READY_TO_DRAFT",
      nextNode: null,
      nextQuestionEn: null,
      developmentRelation: null,
      chainReview: null,
      reuseSuggestion: null,
    });
  });

  it("uses an accepted Reason relation to choose the Development question deterministically", () => {
    const reasonInput: GuidedWritingCoachInputV1 = {
      ...input,
      currentNode: "reason",
      questionEn: questionForNode("reason", undefined, { questionType: "opinion" }),
      learnerAnswer: "It exposes decisions that can harm people outside the company.",
    };
    const reasonEvaluation: GuidedWritingCoachEvaluationV1 = {
      ...accepted,
      development_relation: "principle_application",
      accepted_span: reasonInput.learnerAnswer,
    };
    expect(validateGuidedWritingCoachEvaluation(reasonEvaluation, reasonInput).valid).toBe(true);
    expect(selectGuidedWritingCoachAction("reason", reasonEvaluation, { questionType: "opinion" }))
      .toEqual({
        type: "ACCEPT_AND_CONTINUE",
        nextNode: "mechanism",
        nextQuestionEn: questionForNode("mechanism", undefined, {
          questionType: "opinion",
          developmentRelation: "principle_application",
        }),
        developmentRelation: "principle_application",
        chainReview: null,
        reuseSuggestion: null,
      });
    expect(questionForNode("mechanism", undefined, {
      questionType: "opinion",
      developmentRelation: "principle_application",
    })).toContain("Why does the principle");
  });

  it("validates a full-chain review and deterministically returns to the diagnosed node", () => {
    const graph = Object.fromEntries(argumentNodeOrder.map((node, index) => [node, {
      content: `Learner-owned ${node} ${index}`,
      origin: "user_after_question" as const,
      turnId: `00000000-0000-4000-8000-00000000000${index}`,
    }])) as GuidedWritingChainReviewInputV1["graph"];
    const chainInput: GuidedWritingChainReviewInputV1 = {
      schemaVersion: "guided-writing-chain-review-input.v1",
      sessionId: input.sessionId,
      turnId: input.turnId,
      prompt: input.prompt,
      paragraph: input.paragraph,
      developmentRelation: "causal",
      graph,
    };
    const review: GuidedWritingChainReviewV1 = {
      schema_version: "guided-writing-chain-review.v1",
      turn_id: input.turnId,
      verdict: "return_to_node",
      return_to_node: "reason",
      reason_code: "reason_repeats_claim",
      feedback_en: "The reason restates the claim instead of adding new support.",
      confidence: 0.91,
      needs_review: false,
    };
    expect(validateGuidedWritingChainReview(review, chainInput).valid).toBe(true);
    expect(selectGuidedWritingChainAction(review, {
      questionType: "opinion",
      developmentRelation: "causal",
    })).toEqual({
      type: "RETURN_TO_NODE",
      nextNode: "reason",
      nextQuestionEn: "What new reason can support the paragraph claim without repeating it?",
      developmentRelation: "causal",
      chainReview: review,
      reuseSuggestion: null,
    });
    expect(validateGuidedWritingChainReview({ ...review, return_to_node: "claim" }, chainInput))
      .toMatchObject({ valid: false, errors: expect.arrayContaining(["RETURN_NODE_MISMATCH"]) });
  });

  it("rejects missing, unexpected and drifting Development relations", () => {
    const reasonInput = { ...input, currentNode: "reason" as const };
    expect(validateGuidedWritingCoachEvaluation(accepted, reasonInput)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["DEVELOPMENT_RELATION_REQUIRED"]),
    });
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      development_relation: "causal",
    }, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["UNEXPECTED_DEVELOPMENT_RELATION"]),
    });
    const developmentInput: GuidedWritingCoachInputV1 = {
      ...input,
      currentNode: "mechanism",
      developmentRelation: "comparison",
    };
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      development_relation: "causal",
    }, developmentInput)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["DEVELOPMENT_RELATION_MISMATCH"]),
    });
  });

  it("rejects Chinese feedback and an internally inconsistent accept", () => {
    expect(validateGuidedWritingCoachEvaluation({ ...accepted, feedback_en: "立场清楚。" }, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["FEEDBACK_NOT_ENGLISH"]),
    });
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      dimensions: { ...accepted.dimensions, relevance: "partial" },
    }, input)).toMatchObject({ valid: false, errors: expect.arrayContaining(["INVALID_ACCEPT"]) });
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      dimensions: { ...accepted.dimensions, specificity: "vague" },
    }, input)).toMatchObject({ valid: false, errors: expect.arrayContaining(["INVALID_ACCEPT"]) });
  });

  it("does not let a provider turn Position into a mechanism question", () => {
    const invalidRetry: GuidedWritingCoachEvaluationV1 = {
      ...accepted,
      verdict: "retry",
      dimensions: { relevance: "direct", logic: "incomplete", specificity: "sufficient" },
      issue_type: "missing_logic",
      feedback_en: "You stated a position, but you should explain the missing causal link.",
    };
    expect(validateGuidedWritingCoachEvaluation(invalidRetry, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["ISSUE_NOT_ALLOWED_FOR_NODE"]),
    });
    expect(questionForNode("stance", "missing_logic")).toBe(questionForNode("stance"));
    expect(isGuidedWritingEvaluationActionable("stance", invalidRetry)).toBe(false);
    expect(isGuidedWritingEvaluationActionable("mechanism", invalidRetry)).toBe(true);
  });

  it("keeps a retry on the same node without supplying an idea", () => {
    const retry: GuidedWritingCoachEvaluationV1 = {
      ...accepted,
      verdict: "retry",
      dimensions: { relevance: "direct", logic: "incomplete", specificity: "vague" },
      issue_type: "vague",
      feedback_en: "The direction is relevant, but the claim is still too broad to develop.",
    };
    const action = selectGuidedWritingCoachAction("claim", retry);
    expect(action).toMatchObject({ type: "RETRY_SAME_NODE", nextNode: "claim" });
    expect(action.nextQuestionEn).toBe("Can you make that claim more specific without adding a second main idea?");
  });

  it("keeps only the current exact span and offers a separate later span for learner confirmation", () => {
    const currentSpan = "Humans and animals depend on the same ecosystems.";
    const laterSpan = "Damaging animal populations can disrupt the food chains people rely on.";
    const reasonInput: GuidedWritingCoachInputV1 = {
      ...input,
      currentNode: "reason",
      learnerAnswer: `${currentSpan} ${laterSpan}`,
    };
    const evaluation: GuidedWritingCoachEvaluationV1 = {
      ...accepted,
      development_relation: "causal",
      accepted_span: currentSpan,
      forward_span: { target_node: "mechanism", text: laterSpan },
      feedback_en: "The reason is clear, and your second sentence may already supply the next connection.",
    };
    expect(validateGuidedWritingCoachEvaluation(evaluation, reasonInput).valid).toBe(true);
    expect(selectGuidedWritingCoachAction("reason", evaluation, { questionType: "opinion" }))
      .toMatchObject({
        nextNode: "mechanism",
        reuseSuggestion: {
          sourceTurnId: input.turnId,
          targetNode: "mechanism",
          text: laterSpan,
        },
      });
  });

  it("rejects invented, overlapping or non-accept spans", () => {
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      accepted_span: "A rewritten position not found in the learner answer.",
    }, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["ACCEPTED_SPAN_NOT_IN_ANSWER"]),
    });
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      accepted_span: input.learnerAnswer,
      forward_span: { target_node: "claim", text: "businesses should contribute" },
    }, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["FORWARD_SPAN_OVERLAPS_CURRENT"]),
    });
    expect(validateGuidedWritingCoachEvaluation({
      ...accepted,
      verdict: "retry",
      issue_type: "vague",
      dimensions: { relevance: "direct", logic: "incomplete", specificity: "vague" },
    }, input)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["NON_ACCEPT_CANNOT_SAVE_SPANS"]),
    });
  });
});
