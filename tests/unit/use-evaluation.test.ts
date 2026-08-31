import { describe, expect, it } from "vitest";
import {
  mapEvaluationToFeedback,
  validateUseEvaluation,
  type UseEvaluationInputV1,
  type UseEvaluationV1,
} from "../../src/domain/practice/use-evaluation";

const input: UseEvaluationInputV1 = {
  schemaVersion: "use-eval-input.v1",
  attemptId: "da09c380-d9d9-4a4b-a2d1-e3aa3bd749fe",
  exercise: {
    id: "collocation:421dc97f-3440-52a7-97a8-256046b4c319:guided_application:5",
    exerciseType: "collocation_use",
    instructionZh: "根据中文提示写英文。",
    intendedMeaningZh: "人口老龄化给医疗系统增加压力。",
    targetAsset: {
      id: "421dc97f-3440-52a7-97a8-256046b4c319",
      type: "collocation",
      canonicalText: "place pressure on",
      acceptedVariants: ["place pressure on"],
    },
    referenceAnswers: ["An ageing population places pressure on the healthcare system."],
    allowedParaphrase: true,
  },
  learnerAnswer: "An ageing population places pressure on the healthcare system.",
};

const validEvaluation: UseEvaluationV1 = {
  schema_version: "use-eval.v1",
  attempt_id: input.attemptId,
  verdict: "pass",
  dimensions: {
    meaning: "complete",
    target_expression: "natural",
    grammar: "ok",
    collocation: "natural",
  },
  errors: [],
  positive_evidence: [{
    type: "target_expression",
    span: "places pressure on",
    message_zh: "目标搭配使用自然。",
  }],
  minimal_hint: null,
  confidence: 0.95,
  needs_review: false,
};

describe("use-eval.v1 validation", () => {
  it("accepts a grounded structured evaluation and maps concise feedback", () => {
    const result = validateUseEvaluation(validEvaluation, input);
    expect(result.valid).toBe(true);
    expect(mapEvaluationToFeedback(validEvaluation)).toMatchObject({
      verdict: "pass",
      meaningLabel: "题意内容：完整",
      success: "目标搭配使用自然。",
    });
  });

  it("rejects an attempt mismatch, fabricated span, and an inconsistent pass", () => {
    const result = validateUseEvaluation({
      ...validEvaluation,
      attempt_id: "f73929a0-a128-46c0-9588-53f7a3b11fc4",
      dimensions: { ...validEvaluation.dimensions, meaning: "partial" },
      positive_evidence: [{ ...validEvaluation.positive_evidence[0], span: "invented text" }],
    }, input);
    expect(result).toMatchObject({ valid: false });
    if (result.valid) throw new Error("Expected invalid evaluation");
    expect(result.errors).toEqual(expect.arrayContaining([
      "ATTEMPT_ID_MISMATCH",
      "FABRICATED_EVIDENCE_SPAN",
      "INVALID_PASS",
    ]));
  });

  it("rejects unknown fields before semantic use", () => {
    const result = validateUseEvaluation({ ...validEvaluation, score: 9 }, input);
    expect(result.valid).toBe(false);
  });

  it("labels a mechanical typo separately without hiding a substantive problem", () => {
    const typo = { type: "typo" as const, severity: "non_blocking" as const, span: null, message_zh: "simulationr 应为 simulations。" };
    expect(mapEvaluationToFeedback({
      ...validEvaluation,
      dimensions: { ...validEvaluation.dimensions, grammar: "minor_issue" },
      errors: [typo],
    })).toMatchObject({
      issue: "simulationr 应为 simulations。",
      issueType: "typo",
      typoOnly: true,
      surfaceNote: null,
    });

    expect(mapEvaluationToFeedback({
      ...validEvaluation,
      verdict: "retry",
      dimensions: { ...validEvaluation.dimensions, grammar: "minor_issue", collocation: "awkward" },
      errors: [
        typo,
        { type: "word_choice", severity: "blocking", span: null, message_zh: "which 的指代使替代关系不清楚。" },
      ],
    })).toMatchObject({
      issue: "which 的指代使替代关系不清楚。",
      issueType: "word_choice",
      typoOnly: false,
      surfaceNote: "simulationr 应为 simulations。",
    });
  });

  it("rejects a provider response that treats a mechanical typo as blocking", () => {
    const result = validateUseEvaluation({
      ...validEvaluation,
      verdict: "retry",
      errors: [{ type: "typo", severity: "blocking", span: null, message_zh: "一处笔误。" }],
    }, input);
    expect(result).toMatchObject({ valid: false });
    if (result.valid) throw new Error("Expected invalid typo severity");
    expect(result.errors).toContain("TYPO_CANNOT_BE_BLOCKING");
  });
});
