import { describe, expect, it } from "vitest";
import {
  selectNextTrainingAction,
  type ApprovedAdaptiveExercises,
} from "../../src/domain/learner-model/adaptive-policy";
import {
  LEARNER_STATE_REDUCER_VERSION,
  LEARNING_EVIDENCE_VERSION,
  type AssetLearnerStateV1,
  type EvidenceOutcome,
  type LearningEvidenceV1,
} from "../../src/domain/learner-model/learning-evidence";
import type { CorrectionPathV1 } from "../../src/domain/learner-model/correction-path";

const assetId = "11111111-1111-4111-8111-111111111111";
const completedAt = "2026-08-24T06:00:00.000Z";

function state(overrides: Partial<AssetLearnerStateV1> = {}): AssetLearnerStateV1 {
  return {
    learnerId: "local-default",
    assetId,
    assetType: "sentence_pattern",
    recall: "developing",
    guidedUse: "weak",
    transferUse: "unknown",
    spontaneousUse: "unknown",
    delayedRetention: "unknown",
    evidenceCounts: {},
    lastAttemptAt: completedAt,
    nextReviewAt: null,
    reducerVersion: LEARNER_STATE_REDUCER_VERSION,
    ...overrides,
  };
}

function evidence({
  dimension = "transfer_use",
  outcome = "success",
  independent = true,
  verdict = "pass",
}: {
  dimension?: "guided_use" | "transfer_use";
  outcome?: EvidenceOutcome;
  independent?: boolean;
  verdict?: "pass" | "retry" | "incomplete" | "cannot_judge";
} = {}): LearningEvidenceV1 {
  return {
    id: "a".repeat(64),
    learnerId: "local-default",
    assetId,
    assetType: "sentence_pattern",
    dimension,
    outcome,
    context: {
      attemptId: "22222222-2222-4222-8222-222222222222",
      hintLevel: independent ? 0 : 1,
      retryIndex: 0,
      referenceShown: !independent,
      origin: independent ? "user_independent" : "user_after_hint",
      evaluatorVerdict: verdict,
    },
    evaluator: {
      schemaVersion: "use-eval.v1",
      promptVersion: "test",
      model: "test",
      confidence: 0.95,
      traceId: "33333333-3333-4333-8333-333333333333",
    },
    occurredAt: completedAt,
    evidenceVersion: LEARNING_EVIDENCE_VERSION,
  };
}

function decide(
  item: LearningEvidenceV1,
  learnerState = state(),
  exercises: ApprovedAdaptiveExercises = {},
  correctionPath?: CorrectionPathV1,
) {
  return selectNextTrainingAction({ assetId, learnerState, evidence: [item], exercises, completedAt, correctionPath });
}

describe("adaptive-policy.v1", () => {
  it("preserves existing navigation when evaluation is not judged", () => {
    const result = decide(evidence({ outcome: "not_judged", verdict: "cannot_judge" }));
    expect(result.action).toEqual({ type: "ADVANCE" });
    expect(result.retest).toBeNull();
    expect(result.reasonCodes).toContain("EVALUATION_NOT_JUDGED");
  });

  it("returns to the source after a failed Use when no approved fallback exercise exists", () => {
    const result = decide(evidence({ outcome: "failure", verdict: "incomplete" }), state({ recall: "stable" }));
    expect(result.action).toEqual({ type: "RETURN_TO_SOURCE", assetId });
    expect(result.guardResults).toContain("guided_exercise_missing");
  });

  it("selects an approved guided fallback after transfer failure and stable recall", () => {
    const guidedUse = { assetId, exerciseId: `sentence:${assetId}:guided_application:1` };
    const result = decide(
      evidence({ outcome: "failure", verdict: "incomplete" }),
      state({ recall: "stable" }),
      { guidedUse },
    );
    expect(result.action).toEqual({ type: "GUIDED_USE", ...guidedUse });
  });

  it("advances an assisted pass and schedules a next-day lower-scaffold retest", () => {
    const result = decide(
      evidence({ outcome: "partial", independent: false }),
      state(),
      {},
      { kind: "substantive", correctionCount: 1 },
    );
    expect(result.action).toEqual({ type: "ADVANCE" });
    expect(result.retest).toEqual({ purpose: "lower_scaffold", dueAt: "2026-08-24T16:00:00.000Z" });
  });

  it("schedules only a quick next-day confirmation after one local grammar correction", () => {
    const result = decide(
      evidence({ outcome: "partial", independent: false }),
      state(),
      {},
      { kind: "minor_surface", correctionCount: 1 },
    );
    expect(result.action).toEqual({ type: "ADVANCE" });
    expect(result.reasonCodes).toContain("LOCAL_CORRECTION_PASS");
    expect(result.retest).toEqual({ purpose: "quick_confirmation", dueAt: "2026-08-24T16:00:00.000Z" });
  });

  it("does not penalize a linked typo-only correction", () => {
    const result = decide(
      evidence({ outcome: "partial", independent: false }),
      state(),
      {},
      { kind: "typo_only", correctionCount: 1 },
    );
    expect(result.reasonCodes).toContain("TYPO_ONLY_CORRECTION");
    expect(result.retest).toEqual({ purpose: "retention", dueAt: "2026-08-27T06:00:00.000Z" });
  });

  it("selects an approved cross-topic exercise after independent guided success", () => {
    const crossTopicUse = { assetId, exerciseId: `collocation:${assetId}:guided_application:1` };
    const result = decide(evidence({ dimension: "guided_use" }), state({ transferUse: "unknown" }), { crossTopicUse });
    expect(result.action).toEqual({ type: "CROSS_TOPIC_USE", ...crossTopicUse });
    expect(result.retest).toBeNull();
  });

  it("advances independent transfer success and schedules a 72-hour retention retest", () => {
    const result = decide(evidence());
    expect(result.action).toEqual({ type: "ADVANCE" });
    expect(result.retest).toEqual({ purpose: "retention", dueAt: "2026-08-27T06:00:00.000Z" });
  });

  it("does not invent a cross-topic exercise when none is approved", () => {
    const result = decide(evidence({ dimension: "guided_use" }), state({ transferUse: "unknown" }));
    expect(result.action).toEqual({ type: "ADVANCE" });
    expect(result.guardResults).toContain("cross_topic_exercise_missing");
  });
});
