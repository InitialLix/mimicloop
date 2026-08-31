import { describe, expect, it } from "vitest";
import { buildCollocationDailyPlan } from "../../src/domain/review/collocation-daily-plan";

const collocations = Array.from({ length: 24 }, (_, index) => ({ id: `collocation-${index + 1}` }));

describe("collocation daily plan", () => {
  it("starts with ten new collocations", () => {
    const plan = buildCollocationDailyPlan({
      collocations,
      progress: collocations.map((item) => ({
        collocationId: item.id,
        learningStage: "new",
        dueAt: "2026-08-16T00:00:00.000Z",
      })),
      attempts: [],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newItemLimit: 10,
      reviewItemLimit: 10,
      useRequiredAfter: "2026-08-16T00:00:00.000Z",
      useReadyIds: collocations.map((item) => item.id),
    });
    expect(plan.queue).toHaveLength(10);
    expect(plan.newCount).toBe(10);
    expect(plan.dueCount).toBe(0);
  });

  it("keeps ten new items even when ten reviews are due", () => {
    const due = collocations.slice(0, 10);
    const plan = buildCollocationDailyPlan({
      collocations,
      progress: collocations.map((item, index) => ({
        collocationId: item.id,
        learningStage: index < 10 ? "recall" : "new",
        dueAt: index < 10 ? "2026-08-16T16:00:00.000Z" : "2026-08-17T00:00:00.000Z",
      })),
      attempts: due.map((item) => ({ collocationId: item.id, exerciseType: "guided_application", completedAt: "2026-08-16T10:00:00.000Z" })),
      now: new Date("2026-08-17T02:00:00.000Z"),
      newItemLimit: 10,
      reviewItemLimit: 10,
      useRequiredAfter: "2026-08-16T00:00:00.000Z",
      useReadyIds: collocations.map((item) => item.id),
    });
    expect(plan.queue).toHaveLength(20);
    expect(plan.newCount).toBe(10);
    expect(plan.dueCount).toBe(10);
  });

  it("keeps a learned but unfinished new item in the new queue", () => {
    const plan = buildCollocationDailyPlan({
      collocations: collocations.slice(0, 2),
      progress: [
        { collocationId: "collocation-1", learningStage: "learned", dueAt: "2026-08-16T09:00:00.000Z" },
        { collocationId: "collocation-2", learningStage: "new", dueAt: "2026-08-16T00:00:00.000Z" },
      ],
      attempts: [],
      now: new Date("2026-08-16T10:00:00.000Z"),
      newItemLimit: 10,
      reviewItemLimit: 10,
      useRequiredAfter: "2026-08-16T00:00:00.000Z",
      useReadyIds: collocations.map((item) => item.id),
    });
    expect(plan.queue.map((item) => item.id)).toEqual(["collocation-1", "collocation-2"]);
    expect(plan.newCount).toBe(2);
  });

  it("keeps Recall-only work unfinished until the application exercise is submitted", () => {
    const plan = buildCollocationDailyPlan({
      collocations: collocations.slice(0, 1),
      progress: [{ collocationId: "collocation-1", learningStage: "recall", dueAt: "2026-08-16T09:00:00.000Z" }],
      attempts: [{
        collocationId: "collocation-1",
        exerciseType: "translation_recall",
        completedAt: "2026-08-16T10:00:00.000Z",
      }],
      now: new Date("2026-08-16T11:00:00.000Z"),
      newItemLimit: 10,
      reviewItemLimit: 10,
      useRequiredAfter: "2026-08-16T09:00:00.000Z",
      useReadyIds: ["collocation-1"],
    });
    expect(plan.completedIds).toEqual([]);
    expect(plan.recallCompletedIds).toEqual(["collocation-1"]);
  });

  it("treats legacy Recall-only items as complete when no reviewed Use prompt exists", () => {
    const plan = buildCollocationDailyPlan({
      collocations: collocations.slice(0, 1),
      progress: [{ collocationId: "collocation-1", learningStage: "recall", dueAt: "2026-08-16T09:00:00.000Z" }],
      attempts: [{
        collocationId: "collocation-1",
        exerciseType: "translation_recall",
        completedAt: "2026-08-16T10:00:00.000Z",
      }],
      now: new Date("2026-08-16T11:00:00.000Z"),
      newItemLimit: 10,
      reviewItemLimit: 10,
      useRequiredAfter: "2026-08-16T09:00:00.000Z",
      useReadyIds: [],
    });
    expect(plan.completedIds).toEqual(["collocation-1"]);
    expect(plan.recallCompletedIds).toEqual([]);
  });

  it("rotates equally due reviews toward the least recently reviewed collocation", () => {
    const plan = buildCollocationDailyPlan({
      collocations: collocations.slice(0, 2),
      progress: [
        { collocationId: "collocation-1", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: "2026-08-16T12:00:00.000Z" },
        { collocationId: "collocation-2", learningStage: "recall", dueAt: "2026-08-17T00:00:00.000Z", lastReviewedAt: "2026-08-15T12:00:00.000Z" },
      ],
      attempts: [
        { collocationId: "collocation-1", exerciseType: "guided_application", completedAt: "2026-08-15T10:00:00.000Z" },
        { collocationId: "collocation-2", exerciseType: "guided_application", completedAt: "2026-08-15T10:00:00.000Z" },
      ],
      now: new Date("2026-08-17T02:00:00.000Z"),
      newItemLimit: 0,
      reviewItemLimit: 2,
      useRequiredAfter: "2026-08-16T00:00:00.000Z",
      useReadyIds: collocations.slice(0, 2).map((item) => item.id),
    });
    expect(plan.queue.map((item) => item.id)).toEqual(["collocation-2", "collocation-1"]);
  });
});
