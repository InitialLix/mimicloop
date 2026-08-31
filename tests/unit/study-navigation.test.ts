import { describe, expect, it } from "vitest";
import {
  buildCollocationRecallNavigation,
  buildCollocationUseNavigation,
  buildRecallNavigation,
  buildUseNavigation,
  taskStartHref,
} from "../../src/domain/review/study-navigation";

const cardIds = ["card-1", "card-2", "card-3", "card-4", "card-5"];

describe("recall completion navigation", () => {
  it("continues to the focus-aware Use step", () => {
    const result = buildRecallNavigation({ cardIds, currentId: "card-3", queue: cardIds, index: 2 });

    expect(result.nextLabel).toBe("进入应用练习");
    expect(result.nextHref).toBe("/practice/card-3/use?queue=card-1%2Ccard-2%2Ccard-3%2Ccard-4%2Ccard-5&index=2");
  });

  it("continues to Use outside today's queue", () => {
    const result = buildRecallNavigation({ cardIds, currentId: "card-3", queue: [], index: -1 });

    expect(result.nextHref).toBe("/practice/card-3/use");
  });
});

describe("Use completion navigation", () => {
  it("continues to the next sentence in today's queue", () => {
    const result = buildUseNavigation({ cardIds, currentId: "card-3", queue: cardIds, index: 2 });

    expect(result.nextLabel).toBe("学习下一句");
    expect(result.nextHref).toBe("/library/card-4?queue=card-1%2Ccard-2%2Ccard-3%2Ccard-4%2Ccard-5&index=3");
  });

  it("opens today's summary after the last sentence", () => {
    const result = buildUseNavigation({ cardIds, currentId: "card-5", queue: cardIds, index: 4 });

    expect(result.nextLabel).toBe("完成今日学习");
    expect(result.nextHref).toBe("/today/summary");
  });

  it("continues from a sentence to a typed collocation task", () => {
    const tasks = [
      { key: "sentence:card-3", kind: "sentence" as const, id: "card-3", isNew: true, recallCompleted: true },
      { key: "collocation:collocation-1", kind: "collocation" as const, id: "collocation-1", isNew: true, recallCompleted: false },
    ];
    const result = buildUseNavigation({
      cardIds,
      currentId: "card-3",
      queue: tasks.map((task) => task.key),
      index: 0,
      tasks,
    });
    expect(result.nextHref).toBe("/library/collocations/collocation-1?queue=sentence%3Acard-3%2Ccollocation%3Acollocation-1&index=1");
  });
});

describe("typed task navigation", () => {
  it("opens a due collocation directly in Recall", () => {
    expect(taskStartHref({
      task: { key: "collocation:item-1", kind: "collocation", id: "item-1", isNew: false, recallCompleted: false },
      queue: ["collocation:item-1"],
      index: 0,
    })).toBe("/practice/collocations/item-1/recall?queue=collocation%3Aitem-1&index=0");
  });

  it("continues from Collocation Recall to Collocation Use when a reviewed prompt exists", () => {
    const tasks = [
      { key: "collocation:item-1", kind: "collocation" as const, id: "item-1", isNew: true, recallCompleted: false },
      { key: "sentence:card-2", kind: "sentence" as const, id: "card-2", isNew: true, recallCompleted: false },
    ];
    const result = buildCollocationRecallNavigation({
      currentId: "item-1",
      queue: tasks.map((task) => task.key),
      index: 0,
      tasks,
      requiresUse: true,
    });
    expect(result.nextHref).toBe("/practice/collocations/item-1/use?queue=collocation%3Aitem-1%2Csentence%3Acard-2&index=0");
    expect(result.nextLabel).toBe("进入应用练习");
  });

  it("continues from Collocation Use to the next typed sentence", () => {
    const tasks = [
      { key: "collocation:item-1", kind: "collocation" as const, id: "item-1", isNew: true, recallCompleted: true, requiresUse: true },
      { key: "sentence:card-2", kind: "sentence" as const, id: "card-2", isNew: true, recallCompleted: false },
    ];
    const result = buildCollocationUseNavigation({
      currentId: "item-1",
      queue: tasks.map((task) => task.key),
      index: 0,
      tasks,
    });
    expect(result.nextHref).toBe("/library/card-2?queue=collocation%3Aitem-1%2Csentence%3Acard-2&index=1");
  });

  it("resumes a half-finished collocation at Use", () => {
    expect(taskStartHref({
      task: { key: "collocation:item-1", kind: "collocation", id: "item-1", isNew: true, recallCompleted: true, requiresUse: true },
      queue: ["collocation:item-1"],
      index: 0,
    })).toBe("/practice/collocations/item-1/use?queue=collocation%3Aitem-1&index=0");
  });
});
