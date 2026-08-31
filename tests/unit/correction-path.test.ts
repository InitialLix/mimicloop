import { describe, expect, it } from "vitest";
import {
  summarizeCorrectionPath,
  type CorrectionObservationV1,
} from "../../src/domain/learner-model/correction-path";

function observation(
  verdict: CorrectionObservationV1["verdict"],
  errors: CorrectionObservationV1["errors"] = [],
): CorrectionObservationV1 {
  return { verdict, errors };
}

describe("Use correction path", () => {
  it("keeps a single evaluated answer independent", () => {
    expect(summarizeCorrectionPath([observation("pass")])).toEqual({ kind: "none", correctionCount: 0 });
  });

  it.each(["grammar", "spelling"] as const)(
    "recognizes one non-blocking %s correction as a local surface correction",
    (type) => {
      expect(summarizeCorrectionPath([
        observation("pass", [{ type, severity: "non_blocking", span: "x", message_zh: "局部问题" }]),
        observation("pass"),
      ])).toEqual({ kind: "minor_surface", correctionCount: 1 });
    },
  );

  it("keeps a typo-only correction separate from a learning error", () => {
    expect(summarizeCorrectionPath([
      observation("pass", [{ type: "typo", severity: "non_blocking", span: "simulationr", message_zh: "笔误" }]),
      observation("pass"),
    ])).toEqual({ kind: "typo_only", correctionCount: 1 });
  });

  it("treats target-expression and blocking corrections as substantive", () => {
    expect(summarizeCorrectionPath([
      observation("retry", [{ type: "target_expression", severity: "blocking", span: null, message_zh: "目标表达错误" }]),
      observation("pass"),
    ])).toEqual({ kind: "substantive", correctionCount: 1 });
  });

  it("treats multiple correction rounds as substantive", () => {
    const localIssue = [{ type: "grammar" as const, severity: "non_blocking" as const, span: "x", message_zh: "局部问题" }];
    expect(summarizeCorrectionPath([
      observation("pass", localIssue),
      observation("pass", localIssue),
      observation("pass"),
    ])).toEqual({ kind: "substantive", correctionCount: 2 });
  });

  it("marks a correction chain unresolved when the final answer still does not pass", () => {
    expect(summarizeCorrectionPath([
      observation("retry"),
      observation("retry"),
    ])).toEqual({ kind: "unresolved", correctionCount: 1 });
  });
});
