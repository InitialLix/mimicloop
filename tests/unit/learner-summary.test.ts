import { describe, expect, it } from "vitest";
import type { AssetLearnerStateV1 } from "../../src/domain/learner-model/learning-evidence";
import { summarizeLearnerAsset, type LearnerSummaryEvidence } from "../../src/lib/learner-summary";

function state(overrides: Partial<AssetLearnerStateV1> = {}): AssetLearnerStateV1 {
  return {
    learnerId: "local-default",
    assetId: "asset-1",
    assetType: "sentence_pattern",
    recall: "unknown",
    guidedUse: "unknown",
    transferUse: "unknown",
    spontaneousUse: "unknown",
    delayedRetention: "unknown",
    evidenceCounts: {},
    lastAttemptAt: null,
    nextReviewAt: null,
    reducerVersion: "learner-state-reducer.v1",
    ...overrides,
  };
}

function evidence(overrides: Partial<LearnerSummaryEvidence> = {}): LearnerSummaryEvidence {
  return {
    dimension: "transfer_use",
    outcome: "partial",
    independent: false,
    occurredAt: "2026-08-24T06:00:00.000Z",
    context: {
      attemptId: "attempt-1",
      hintLevel: 1,
      retryIndex: 0,
      referenceShown: true,
      origin: "user_after_hint",
      evaluatorVerdict: "pass",
    },
    ...overrides,
  };
}

describe("learner summary presenter", () => {
  it("compresses an assisted pass into one actionable stage", () => {
    expect(summarizeLearnerAsset(state({ recall: "weak", guidedUse: "weak", transferUse: "weak" }), [evidence()]))
      .toMatchObject({ stage: "assisted_use", label: "提示后完成" });
  });

  it("distinguishes independent Use from assisted Use", () => {
    expect(summarizeLearnerAsset(state({ guidedUse: "developing", transferUse: "developing" }), [
      evidence({ outcome: "success", independent: true, context: { ...evidence().context, hintLevel: 0, referenceShown: false, origin: "user_independent" } }),
    ])).toMatchObject({ stage: "independent_use", label: "独立 Use 通过" });
  });

  it("shows Recall as a stage instead of four parallel dimensions", () => {
    expect(summarizeLearnerAsset(state({ recall: "developing" }), [evidence({ dimension: "recall", outcome: "success", independent: true })]))
      .toMatchObject({ stage: "recall", label: "Recall 通过" });
  });

  it("uses delayed evidence as the final retained stage", () => {
    expect(summarizeLearnerAsset(state({ delayedRetention: "developing" }), [evidence({ dimension: "delayed_retention", outcome: "success", independent: true })]))
      .toMatchObject({ stage: "retained", label: "跨日验证通过" });
  });
});
