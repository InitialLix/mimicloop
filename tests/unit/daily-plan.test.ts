import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "../../src/domain/review/daily-plan";

const cards = Array.from({ length: 7 }, (_, index) => ({ id: `card-${index + 1}` }));
const newStates = cards.map((card) => ({
  cardId: card.id,
  learningStage: "new",
  dueAt: "2026-08-16T00:00:00.000Z",
}));

describe("daily study plan", () => {
  it("starts with the configured number of new cards", () => {
    const plan = buildDailyPlan({
      cards,
      reviewStates: newStates,
      attempts: [],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.queue.map((card) => card.id)).toEqual(["card-1", "card-2", "card-3", "card-4", "card-5"]);
    expect(plan.completedCount).toBe(0);
    expect(plan.newCount).toBe(5);
  });

  it("keeps today's completed cards at the front and fills the remaining slots", () => {
    const plan = buildDailyPlan({
      cards,
      reviewStates: newStates,
      attempts: [
        { cardId: "card-1", exerciseType: "slot_replacement", completedAt: "2026-08-16T08:00:00.000Z" },
        { cardId: "card-2", exerciseType: "guided_application", completedAt: "2026-08-16T09:00:00.000Z" },
      ],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.queue.map((card) => card.id)).toEqual(["card-1", "card-2", "card-3", "card-4", "card-5"]);
    expect(plan.completedIds).toEqual(["card-1", "card-2"]);
    expect(plan.completedCount).toBe(2);
    expect(plan.newCount).toBe(5);
  });

  it("returns yesterday's completed card as due on the next Shanghai day", () => {
    const plan = buildDailyPlan({
      cards,
      reviewStates: [
        { cardId: "card-1", learningStage: "recall", dueAt: "2026-08-16T16:00:00.000Z" },
        ...newStates.slice(1),
      ],
      attempts: [{ cardId: "card-1", exerciseType: "slot_replacement", completedAt: "2026-08-16T10:00:00.000Z" }],
      now: new Date("2026-08-17T01:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.queue[0]?.id).toBe("card-1");
    expect(plan.dueCount).toBe(1);
    expect(plan.completedCount).toBe(0);
  });

  it("keeps a post-rollout Recall attempt in progress until Use is completed", () => {
    const plan = buildDailyPlan({
      cards,
      reviewStates: newStates,
      attempts: [{ cardId: "card-1", exerciseType: "translation_recall", completedAt: "2026-08-16T09:00:00.000Z" }],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.queue[0]?.id).toBe("card-1");
    expect(plan.completedCount).toBe(0);
    expect(plan.recallCompletedIds).toEqual(["card-1"]);
  });

  it("preserves completed progress recorded before the adaptive Use rollout", () => {
    const plan = buildDailyPlan({
      cards,
      reviewStates: newStates,
      attempts: [{ cardId: "card-1", exerciseType: "translation_recall", completedAt: "2026-08-16T06:00:00.000Z" }],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.completedIds).toContain("card-1");
    expect(plan.recallCompletedIds).toEqual([]);
  });

  it("keeps independent quotas for due reviews and new cards", () => {
    const mixedCards = Array.from({ length: 10 }, (_, index) => ({ id: `mixed-${index + 1}` }));
    const plan = buildDailyPlan({
      cards: mixedCards,
      reviewStates: mixedCards.map((card, index) => ({
        cardId: card.id,
        learningStage: index < 5 ? "recall" : "new",
        dueAt: index < 5 ? "2026-08-16T16:00:00.000Z" : "2026-08-17T10:00:00.000Z",
      })),
      attempts: mixedCards.slice(0, 5).map((card) => ({
        cardId: card.id,
        exerciseType: "slot_replacement",
        completedAt: "2026-08-16T10:00:00.000Z",
      })),
      now: new Date("2026-08-17T01:00:00.000Z"),
      newCardLimit: 5,
      reviewCardLimit: 5,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(plan.queue.map((card) => card.id)).toEqual([
      "mixed-1", "mixed-6", "mixed-2", "mixed-7", "mixed-3",
      "mixed-8", "mixed-4", "mixed-9", "mixed-5", "mixed-10",
    ]);
    expect(plan.dueCount).toBe(5);
    expect(plan.newCount).toBe(5);
  });

  it("orders equally due reviews by the oldest last review instead of the card id", () => {
    const plan = buildDailyPlan({
      cards: cards.slice(0, 2),
      reviewStates: [
        { cardId: "card-1", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: "2026-08-16T12:00:00.000Z" },
        { cardId: "card-2", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: "2026-08-15T12:00:00.000Z" },
      ],
      attempts: [],
      now: new Date("2026-08-17T02:00:00.000Z"),
      newCardLimit: 0,
      reviewCardLimit: 2,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });
    expect(plan.queue.map((card) => card.id)).toEqual(["card-2", "card-1"]);
  });

  it("includes and prioritizes an explicitly due adaptive retest without changing its review state", () => {
    const plan = buildDailyPlan({
      cards: cards.slice(0, 2),
      reviewStates: [
        { cardId: "card-1", learningStage: "recall", dueAt: "2026-08-18T00:00:00.000Z", retestPriority: 3 },
        { cardId: "card-2", learningStage: "recall", dueAt: "2026-08-16T00:00:00.000Z" },
      ],
      attempts: [],
      now: new Date("2026-08-17T02:00:00.000Z"),
      newCardLimit: 0,
      reviewCardLimit: 2,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
      forcedDueIds: ["card-1"],
    });
    expect(plan.queue.map((card) => card.id)).toEqual(["card-1", "card-2"]);
  });

  it("uses learner memory only as a tie-breaker after due time and recency", () => {
    const plan = buildDailyPlan({
      cards: cards.slice(0, 2),
      reviewStates: [
        { cardId: "card-1", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: null, memoryPriority: 0 },
        { cardId: "card-2", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: null, memoryPriority: 3 },
      ],
      attempts: [],
      now: new Date("2026-08-17T02:00:00.000Z"),
      newCardLimit: 0,
      reviewCardLimit: 2,
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });
    expect(plan.queue.map((card) => card.id)).toEqual(["card-2", "card-1"]);
  });
});
