import { describe, expect, it } from "vitest";
import { adaptiveCompletionNavigation, adaptiveRetestLabel } from "../../src/domain/review/adaptive-navigation";

const common = {
  nextHref: "/today/summary",
  nextLabel: "完成今日学习",
  sourceHref: "/library/card-1",
  retryHref: "/practice/card-1/use?queue=sentence%3Acard-1&index=0",
};

describe("adaptive completion navigation", () => {
  it("uses concise labels for each retest purpose", () => {
    expect(adaptiveRetestLabel({ purpose: "quick_confirmation", dueAt: "2026-08-25T00:00:00.000Z" })).toBe("快速确认");
    expect(adaptiveRetestLabel({ purpose: "lower_scaffold", dueAt: "2026-08-25T00:00:00.000Z" })).toBe("提示复测");
    expect(adaptiveRetestLabel({ purpose: "retention", dueAt: "2026-08-27T00:00:00.000Z" })).toBe("保持复测");
  });

  it("preserves the exact existing navigation when the feature has no result", () => {
    expect(adaptiveCompletionNavigation({ ...common, step: null })).toEqual({
      href: common.nextHref,
      label: common.nextLabel,
      differsFromPlan: false,
      retest: null,
    });
  });

  it("maps a source return without losing the original queue override", () => {
    const result = adaptiveCompletionNavigation({
      ...common,
      step: { action: { type: "RETURN_TO_SOURCE", assetId: "card-1" }, retest: null },
    });
    expect(result).toMatchObject({ href: common.sourceHref, label: "回看学习内容", differsFromPlan: true });
  });

  it("keeps the current queue context for an approved cross-topic retry", () => {
    const result = adaptiveCompletionNavigation({
      ...common,
      step: { action: { type: "CROSS_TOPIC_USE", assetId: "card-1", exerciseId: "exercise-1" }, retest: null },
    });
    expect(result).toMatchObject({ href: common.retryHref, label: "换场景再用一次", differsFromPlan: true });
  });
});
