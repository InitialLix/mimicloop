import { describe, expect, it } from "vitest";
import {
  restoreNodeLanguageWork,
  validateGuidedWritingNodeLanguageEvaluation,
  type GuidedWritingNodeLanguageAttemptView,
  type GuidedWritingNodeLanguageEvaluationV1,
  type GuidedWritingNodeLanguageInputV1,
} from "../../src/domain/writing/node-language-activation";

const attemptId = "9128a0d6-c0a3-4e30-a245-1cb9fb578fa8";
const learnerText = "This disruption weakens the ecosystems on which people depend.";

const input: GuidedWritingNodeLanguageInputV1 = {
  schemaVersion: "guided-writing-node-language-input.v1",
  sessionId: "69445162-3763-41a8-9e1c-a23c19215ab8",
  attemptId,
  prompt: { sourceEssayId: "1c7d0d36-e4d4-4663-9f4b-8f93d83db8a0", text: "Prompt", questionType: "opinion" },
  paragraph: { key: "body_1", role: "Support the position", goal: "Develop one reason" },
  node: "mechanism",
  plannedMeaning: "Ecological disruption harms the environment people depend on.",
  argumentGraph: {
    stance: { content: "Protect animals.", origin: "user_after_question", turnId: "73f9440d-81fc-45e5-9f49-4ca09419072a" },
    claim: { content: "Animals support human environments.", origin: "user_after_question", turnId: "92435e07-e25d-45b0-89f5-059894af9442" },
    reason: { content: "Species share ecosystems.", origin: "user_after_question", turnId: "2e65778d-142e-4a2a-b326-1e49c099ae73" },
    mechanism: { content: "Decline disrupts ecosystems.", origin: "user_after_question", turnId: "3d35f25b-4f57-4eef-83d1-95c91ea34f80" },
    result: { content: "Protection also supports people.", origin: "user_after_question", turnId: "7363d515-e17b-4dbc-a986-1680796ad1d4" },
  },
  learnerText,
  assistance: { hintLevel: 0, targetWasShown: false },
  targetAsset: null,
};

function evaluation(overrides: Partial<GuidedWritingNodeLanguageEvaluationV1> = {}): GuidedWritingNodeLanguageEvaluationV1 {
  return {
    schema_version: "guided-writing-node-language-evaluation.v1",
    attempt_id: attemptId,
    verdict: "pass",
    dimensions: { meaning: "complete", logic: "fits_node", target_usage: "not_required", naturalness: "natural" },
    errors: [],
    accepted_text: learnerText,
    feedback_en: "This realizes the planned mechanism clearly.",
    minimal_hint_en: null,
    confidence: 0.93,
    needs_review: false,
    ...overrides,
  };
}

describe("Guided Writing node language evaluation", () => {
  it("accepts an independent realization without inventing a target requirement", () => {
    expect(validateGuidedWritingNodeLanguageEvaluation(evaluation(), input)).toEqual({ valid: true, evaluation: evaluation() });
  });

  it("rejects a target judgment when the target was never shown", () => {
    const result = validateGuidedWritingNodeLanguageEvaluation(evaluation({
      dimensions: { ...evaluation().dimensions, target_usage: "natural" },
    }), input);
    expect(result).toMatchObject({ valid: false });
    if (!result.valid) expect(result.errors).toContain("UNSHOWN_TARGET_MUST_BE_NOT_REQUIRED");
  });

  it("rejects rewritten accepted text", () => {
    const result = validateGuidedWritingNodeLanguageEvaluation(evaluation({ accepted_text: "A polished replacement." }), input);
    expect(result).toMatchObject({ valid: false });
    if (!result.valid) expect(result.errors).toContain("PASS_ACCEPTED_TEXT_MUST_EQUAL_LEARNER_TEXT");
  });

  it("restores the latest failed draft and keeps its message scoped to that node", () => {
    const baseAttempt: GuidedWritingNodeLanguageAttemptView = {
      id: "2fb7debf-064f-45a8-b78b-c42b877f3d4b",
      sessionId: input.sessionId,
      node: "claim",
      learnerText: "Animals and people depend on the same natural systems.",
      assetType: null,
      assetId: null,
      hintLevel: 1,
      status: "error",
      evaluation: null,
      model: "deepseek-v4-flash",
      errorCode: "PROVIDER_NETWORK_ERROR",
      createdAt: "2026-08-30T02:41:22.117Z",
      completedAt: "2026-08-30T02:41:23.117Z",
    };
    const latestAttempt = {
      ...baseAttempt,
      id: "bc78d19b-3676-4d61-89fd-b912320a11d9",
      learnerText: "Wildlife protection also protects the natural systems that people need.",
      hintLevel: 2 as const,
      createdAt: "2026-08-30T02:42:01.880Z",
      completedAt: "2026-08-30T02:42:02.880Z",
    };
    const restored = restoreNodeLanguageWork([latestAttempt, baseAttempt]);
    expect(restored.drafts).toEqual({ claim: latestAttempt.learnerText });
    expect(restored.hintLevels).toEqual({ claim: 2 });
    expect(restored.messages.claim).toContain("saved draft has been restored");
    expect(restored.messages.reason).toBeUndefined();
    expect(restored.nextNode).toBe("claim");
    expect(restored.allNodesPassed).toBe(false);
  });

  it("restores the first unfinished node instead of returning to Main point", () => {
    const passedClaim: GuidedWritingNodeLanguageAttemptView = {
      id: "f0e02884-806d-44ad-9712-00abbd68b935",
      sessionId: input.sessionId,
      node: "claim",
      learnerText: "Wildlife protection also protects the natural systems that people need.",
      assetType: null,
      assetId: null,
      hintLevel: 0,
      status: "success",
      evaluation: evaluation({
        attempt_id: "f0e02884-806d-44ad-9712-00abbd68b935",
        accepted_text: "Wildlife protection also protects the natural systems that people need.",
      }),
      model: "deepseek-v4-flash",
      errorCode: null,
      createdAt: "2026-08-30T03:00:00.000Z",
      completedAt: "2026-08-30T03:00:02.000Z",
    };
    const restored = restoreNodeLanguageWork([passedClaim]);
    expect(restored.nextNode).toBe("reason");
    expect(restored.allNodesPassed).toBe(false);
  });
});
