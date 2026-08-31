import { describe, expect, it } from "vitest";
import {
  MAX_USE_RETRIES,
  recallReferenceUsesAssistance,
  referenceRevealUsesAssistance,
  revisionTreatment,
  selectTeachingAction,
} from "../../src/domain/practice/teaching-action";
import type { UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";

function evaluation(overrides: Partial<UseEvaluationV1> = {}): UseEvaluationV1 {
  return {
    schema_version: "use-eval.v1",
    attempt_id: "da09c380-d9d9-4a4b-a2d1-e3aa3bd749fe",
    verdict: "retry",
    dimensions: { meaning: "complete", target_expression: "used_with_error", grammar: "ok", collocation: "awkward" },
    errors: [],
    positive_evidence: [],
    minimal_hint: { kind: "preposition_cue", text_zh: "检查目标搭配中的介词。" },
    confidence: 0.9,
    needs_review: false,
    ...overrides,
  };
}

describe("Phase 2.2 deterministic teaching actions", () => {
  it("passes a valid answer without changing progress", () => {
    expect(selectTeachingAction({ evaluation: evaluation({ verdict: "pass", minimal_hint: null }), retryIndex: 0 }))
      .toEqual({ type: "PASS" });
  });

  it("gives one new minimal hint before the retry limit", () => {
    expect(selectTeachingAction({ evaluation: evaluation(), retryIndex: 0 }))
      .toEqual({ type: "GIVE_MINIMAL_HINT", hint: { kind: "preposition_cue", text_zh: "检查目标搭配中的介词。" } });
  });

  it("does not repeat an unchanged hint", () => {
    expect(selectTeachingAction({
      evaluation: evaluation(),
      retryIndex: 1,
      previousHints: [{ kind: "preposition_cue", text_zh: "检查目标搭配中的介词。" }],
    })).toEqual({ type: "RETRY" });
  });

  it("shows the reference at the retry limit or when judgment is unavailable", () => {
    expect(selectTeachingAction({ evaluation: evaluation(), retryIndex: MAX_USE_RETRIES }))
      .toEqual({ type: "SHOW_REFERENCE" });
    expect(selectTeachingAction({ evaluation: evaluation({ verdict: "cannot_judge" }), retryIndex: 0 }))
      .toEqual({ type: "SHOW_REFERENCE" });
    expect(selectTeachingAction({ evaluation: null, retryIndex: 0 })).toEqual({ type: "SHOW_REFERENCE" });
  });

  it("keeps a pre-reference PASS independent when the learner only compares afterwards", () => {
    expect(referenceRevealUsesAssistance({ type: "PASS" }, false)).toBe(false);
    expect(referenceRevealUsesAssistance({ type: "PASS" }, true)).toBe(true);
    expect(referenceRevealUsesAssistance({ type: "SHOW_REFERENCE" }, false)).toBe(true);
    expect(referenceRevealUsesAssistance(null, false)).toBe(true);
  });

  it("keeps normal Recall comparison independent until the learner resumes editing", () => {
    expect(recallReferenceUsesAssistance("reveal_after_answer", false)).toBe(false);
    expect(recallReferenceUsesAssistance("reveal_after_answer", true)).toBe(true);
    expect(recallReferenceUsesAssistance("continue_editing", false)).toBe(true);
  });

  it("does not count a mechanical typo correction as assistance or a retry", () => {
    expect(revisionTreatment({
      verdict: "pass",
      meaningLabel: "题意内容：完整",
      success: null,
      issue: "simulationr 应为 simulations。",
      issueType: "typo",
      issueSeverity: "non_blocking",
      surfaceNote: null,
      typoOnly: true,
      hint: null,
      needsReview: false,
    })).toEqual({
      countsAsAssistance: false,
      continuesRetryChain: false,
      draftMode: "typo",
    });
  });
});
