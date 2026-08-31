import { describe, expect, it } from "vitest";
import {
  LEARNING_EVIDENCE_VERSION,
  type EvidenceDimension,
  type EvidenceOutcome,
  type LearningEvidenceV1,
} from "../../src/domain/learner-model/learning-evidence";
import { reduceLearnerState } from "../../src/domain/learner-model/learner-state-reducer";

function evidence(input: {
  id: string;
  occurredAt: string;
  dimension?: EvidenceDimension;
  outcome?: EvidenceOutcome;
  independent?: boolean;
  evaluatorVerdict?: LearningEvidenceV1["context"]["evaluatorVerdict"];
}): LearningEvidenceV1 {
  const independent = input.independent ?? true;
  return {
    id: input.id,
    learnerId: "local-default",
    assetId: "asset-1",
    assetType: "sentence_pattern",
    dimension: input.dimension ?? "transfer_use",
    outcome: input.outcome ?? "success",
    context: {
      attemptId: input.id,
      hintLevel: independent ? 0 : 1,
      retryIndex: 0,
      referenceShown: !independent,
      origin: independent ? "user_independent" : "user_after_hint",
      evaluatorVerdict: input.evaluatorVerdict ?? "pass",
    },
    evaluator: {
      schemaVersion: "use-eval.v1",
      promptVersion: "test",
      model: "test",
      confidence: 0.99,
      traceId: "trace",
    },
    occurredAt: input.occurredAt,
    evidenceVersion: LEARNING_EVIDENCE_VERSION,
  };
}

describe("learner state reducer v1", () => {
  it("ignores not-judged observations and keeps unsupported dimensions unknown", () => {
    const state = reduceLearnerState([
      evidence({ id: "a", occurredAt: "2026-08-20T01:00:00.000Z", outcome: "not_judged" }),
    ]);
    expect(state).toMatchObject({
      recall: "unknown",
      guidedUse: "unknown",
      transferUse: "unknown",
      spontaneousUse: "unknown",
      delayedRetention: "unknown",
      reducerVersion: "learner-state-reducer.v1",
    });
  });

  it("lets transfer evidence support guided use without inventing spontaneous use", () => {
    const state = reduceLearnerState([
      evidence({ id: "a", occurredAt: "2026-08-20T01:00:00.000Z", outcome: "partial", independent: false }),
      evidence({ id: "b", occurredAt: "2026-08-21T01:00:00.000Z", outcome: "partial", independent: false }),
    ]);
    expect(state).toMatchObject({ guidedUse: "developing", transferUse: "developing", spontaneousUse: "unknown" });
  });

  it("requires repeated independent evidence for stable and resists a single later failure", () => {
    const base = [
      evidence({ id: "a", occurredAt: "2026-08-20T01:00:00.000Z" }),
      evidence({ id: "b", occurredAt: "2026-08-24T01:00:00.000Z" }),
    ];
    expect(reduceLearnerState(base)?.transferUse).toBe("stable");
    expect(reduceLearnerState([
      ...base,
      evidence({ id: "c", occurredAt: "2026-08-25T01:00:00.000Z", outcome: "failure" }),
    ])?.transferUse).toBe("stable");
    expect(reduceLearnerState([
      ...base,
      evidence({ id: "c", occurredAt: "2026-08-25T01:00:00.000Z", outcome: "failure" }),
      evidence({ id: "d", occurredAt: "2026-08-26T01:00:00.000Z", outcome: "failure" }),
    ])?.transferUse).toBe("developing");
  });

  it("does not let one success erase repeated failures", () => {
    const state = reduceLearnerState([
      evidence({ id: "a", occurredAt: "2026-08-20T01:00:00.000Z", outcome: "failure" }),
      evidence({ id: "b", occurredAt: "2026-08-21T01:00:00.000Z", outcome: "failure" }),
      evidence({ id: "c", occurredAt: "2026-08-22T01:00:00.000Z" }),
    ]);
    expect(state?.transferUse).toBe("weak");
  });
});
