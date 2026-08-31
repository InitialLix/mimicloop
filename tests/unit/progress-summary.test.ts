import { describe, expect, it } from "vitest";
import { buildProgressSummary, type ProgressCard } from "../../src/domain/review/progress-summary";

const cards: ProgressCard[] = [
  { id: "card-1", learning_sentence: "Sentence one.", translation_zh: "句子一。", primary_focus: "structure", topics: ["education"] },
  { id: "card-2", learning_sentence: "Sentence two.", translation_zh: "句子二。", primary_focus: "vocabulary", topics: ["technology"] },
  { id: "card-3", learning_sentence: "Sentence three.", translation_zh: "句子三。", primary_focus: "mixed", topics: ["education"] },
];

describe("progress summary", () => {
  it("treats a Recall-only card as in progress without counting the cycle as complete", () => {
    const summary = buildProgressSummary({
      cards,
      reviewStates: cards.map((card) => ({ cardId: card.id, learningStage: "new", dueAt: "2026-08-16T16:00:00.000Z" })),
      attempts: [{
        cardId: "card-1",
        exerciseType: "translation_recall",
        selfRating: "recalled",
        completedAt: "2026-08-17T02:00:00.000Z",
      }],
      now: new Date("2026-08-17T04:00:00.000Z"),
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(summary.practicedCards).toBe(1);
    expect(summary.stageCounts).toEqual({ new: 2, learned: 1, recall: 0, use: 0 });
    expect(summary.completedToday).toBe(0);
  });

  it("counts a completed Use once per card and groups activity by Shanghai date", () => {
    const summary = buildProgressSummary({
      cards,
      reviewStates: [
        { cardId: "card-1", learningStage: "recall", dueAt: "2026-08-17T16:00:00.000Z" },
        { cardId: "card-2", learningStage: "recall", dueAt: "2026-08-17T16:00:00.000Z" },
        { cardId: "card-3", learningStage: "new", dueAt: "2026-08-16T16:00:00.000Z" },
      ],
      attempts: [
        { cardId: "card-1", exerciseType: "slot_replacement", selfRating: "recalled", completedAt: "2026-08-16T16:20:00.000Z" },
        { cardId: "card-1", exerciseType: "slot_replacement", selfRating: "recalled", completedAt: "2026-08-16T16:25:00.000Z" },
        { cardId: "card-2", exerciseType: "guided_application", selfRating: "can_use", completedAt: "2026-08-16T17:00:00.000Z" },
      ],
      now: new Date("2026-08-17T04:00:00.000Z"),
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(summary.completedToday).toBe(2);
    expect(summary.completedLast7Days).toBe(2);
    expect(summary.recentCards.map((item) => item.id)).toEqual(["card-2", "card-1"]);
  });

  it("preserves the pre-rollout Recall completion rule", () => {
    const summary = buildProgressSummary({
      cards,
      reviewStates: cards.map((card) => ({ cardId: card.id, learningStage: "new", dueAt: "2026-08-16T16:00:00.000Z" })),
      attempts: [{
        cardId: "card-3",
        exerciseType: "translation_recall",
        selfRating: "fuzzy",
        completedAt: "2026-08-16T06:00:00.000Z",
      }],
      now: new Date("2026-08-16T10:00:00.000Z"),
      useRequiredAfter: "2026-08-16T07:00:00.000Z",
    });

    expect(summary.completedToday).toBe(1);
  });
});
