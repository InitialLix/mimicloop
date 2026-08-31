import { describe, expect, it } from "vitest";
import { nextReviewState } from "../../src/domain/review/schedule";

describe("next-day review schedule", () => {
  const completedAt = new Date("2026-08-16T10:00:00.000Z");

  it.each([
    ["forgot", "learned", "2026-08-16T16:00:00.000Z"],
    ["fuzzy", "recall", "2026-08-16T16:00:00.000Z"],
    ["recalled", "recall", "2026-08-16T16:00:00.000Z"],
    ["can_use", "use", "2026-08-16T16:00:00.000Z"],
  ] as const)("schedules %s for the next Shanghai day", (rating, stage, dueAt) => {
    const result = nextReviewState(rating, completedAt);
    expect(result.learningStage).toBe(stage);
    expect(result.dueAt).toBe(dueAt);
  });
});
