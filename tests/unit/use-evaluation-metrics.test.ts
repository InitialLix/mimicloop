import { describe, expect, it } from "vitest";
import type { UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";
import {
  calculateUseEvaluationMetrics,
  diagnoseUseEvaluationCase,
  type UseEvaluationGoldExpectation,
} from "../../src/domain/practice/use-evaluation-metrics";

function evaluation(attemptId: string, verdict: UseEvaluationV1["verdict"], blocking: boolean): UseEvaluationV1 {
  return {
    schema_version: "use-eval.v1",
    attempt_id: attemptId,
    verdict,
    dimensions: {
      meaning: verdict === "pass" ? "complete" : "missing",
      target_expression: verdict === "pass" ? "natural" : "not_used",
      grammar: "ok",
      collocation: "natural",
    },
    errors: blocking ? [{ type: "meaning", severity: "blocking", span: null, message_zh: "核心意思缺失。" }] : [],
    positive_evidence: [],
    minimal_hint: null,
    confidence: 0.9,
    needs_review: false,
  };
}

describe("Use evaluator gold metrics", () => {
  it("reports false passes, false fails, blocking quality, and invalid output", () => {
    const metrics = calculateUseEvaluationMetrics([
      {
        expected: { verdict: "pass", meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural", blocking: [] },
        actual: evaluation("1", "retry", true),
      },
      {
        expected: { verdict: "retry", meaning: "missing", target_expression: "not_used", grammar: "ok", collocation: "natural", blocking: ["meaning"] },
        actual: evaluation("2", "pass", false),
      },
      {
        expected: { verdict: "retry", meaning: "missing", target_expression: "not_used", grammar: "ok", collocation: "natural", blocking: ["meaning"] },
        actual: null,
      },
    ]);

    expect(metrics).toMatchObject({
      total: 3,
      valid: 2,
      schemaValidRate: 2 / 3,
      verdictAgreement: 0,
      exactAgreement: 0,
      falsePassRate: 1 / 2,
      falseFailRate: 1,
      blockingPrecision: 0,
      blockingRecall: 0,
      blockingRecallEvaluable: 0,
    });
  });

  it("separates blocking recall for evaluable answers from cannot-judge safety cases", () => {
    const blocked = evaluation("1", "retry", true);
    const cannotJudge = evaluation("2", "retry", false);
    cannotJudge.verdict = "cannot_judge";
    cannotJudge.dimensions.meaning = "cannot_judge";
    cannotJudge.dimensions.target_expression = "cannot_judge";

    const metrics = calculateUseEvaluationMetrics([
      {
        expected: { verdict: "retry", meaning: "missing", target_expression: "not_used", grammar: "ok", collocation: "natural", blocking: ["meaning"] },
        actual: blocked,
      },
      {
        expected: { verdict: "cannot_judge", meaning: "cannot_judge", target_expression: "cannot_judge", grammar: "ok", collocation: "natural", blocking: ["target_expression"] },
        actual: cannotJudge,
      },
    ]);

    expect(metrics.blockingRecall).toBe(0.5);
    expect(metrics.blockingRecallEvaluable).toBe(1);
  });

  it("reports per-case dimension and blocking disagreements without learner text", () => {
    const expected: UseEvaluationGoldExpectation = {
      verdict: "retry",
      meaning: "missing",
      target_expression: "not_used",
      grammar: "ok",
      collocation: "natural",
      blocking: ["meaning"],
    };
    const diagnostic = diagnoseUseEvaluationCase("case-01", expected, evaluation("1", "pass", false));

    expect(diagnostic.exact).toBe(false);
    expect(diagnostic.mismatches).toEqual(expect.arrayContaining([
      "verdict:retry->pass",
      "meaning:missing->complete",
      "target_expression:not_used->natural",
      "blocking:[meaning]->[]",
    ]));
    expect(JSON.stringify(diagnostic)).not.toContain("learnerAnswer");
  });
});
