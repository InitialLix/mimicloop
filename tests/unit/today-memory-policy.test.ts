import { describe, expect, it } from "vitest";
import {
  adaptiveRetestPriority,
  learnerMemoryPriority,
  rebalanceTodayBudget,
} from "../../src/domain/review/today-memory-policy";

describe("Today memory policy", () => {
  it("keeps the configured ratio when the review quota can absorb all due work", () => {
    expect(rebalanceTodayBudget({ baseNewLimit: 5, baseReviewLimit: 5, dueCount: 4 })).toEqual({
      newLimit: 5,
      reviewLimit: 5,
      shiftedSlots: 0,
    });
  });

  it("moves at most half of new slots to review when due work has accumulated", () => {
    expect(rebalanceTodayBudget({ baseNewLimit: 10, baseReviewLimit: 10, dueCount: 18 })).toEqual({
      newLimit: 5,
      reviewLimit: 15,
      shiftedSlots: 5,
    });
  });

  it("uses bounded learner-state and retest priorities", () => {
    expect(learnerMemoryPriority("weak")).toBeGreaterThan(learnerMemoryPriority("developing"));
    expect(learnerMemoryPriority("developing")).toBeGreaterThan(learnerMemoryPriority("stable"));
    expect(adaptiveRetestPriority("lower_scaffold")).toBeGreaterThan(adaptiveRetestPriority("quick_confirmation"));
    expect(adaptiveRetestPriority("quick_confirmation")).toBeGreaterThan(adaptiveRetestPriority("retention"));
  });
});
