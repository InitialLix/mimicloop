import { describe, expect, it } from "vitest";
import { buildCollocationUseTask } from "../../src/domain/practice/collocation-use-task";
import type { CollocationData } from "../../src/lib/content-types";

const collocation = {
  id: "421dc97f-3440-52a7-97a8-256046b4c319",
  exercise_seed: {
    guided_application: {
      prompt_zh: "政府有一个有说服力的理由推迟这项决定。",
      hints: [{ zh: "推迟这项决定", en: "delay the decision" }],
      target_surface: "a compelling reason",
      reference_answer: "The government has a compelling reason to delay the decision.",
      transfer_type: "slot_replacement" as const,
    },
  },
} as CollocationData;

describe("collocation Use task", () => {
  it("builds a reviewed changed-context translation task", () => {
    expect(buildCollocationUseTask(collocation)).toEqual({
      exerciseType: "guided_application",
      guidedPrompt: {
        text: "政府有一个有说服力的理由推迟这项决定。",
        hints: [{ zh: "推迟这项决定", en: "delay the decision" }],
      },
      targetSurface: "a compelling reason",
      referenceAnswer: "The government has a compelling reason to delay the decision.",
      transferType: "slot_replacement",
    });
  });

  it("rejects a collocation without a reviewed Use prompt", () => {
    expect(() => buildCollocationUseTask({ ...collocation, exercise_seed: {} }))
      .toThrow(/missing a reviewed guided application exercise/);
  });
});
