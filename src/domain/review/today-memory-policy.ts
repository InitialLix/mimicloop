import type { AbilityState } from "../learner-model/learning-evidence";

export type TodayRetestPurpose = "quick_confirmation" | "lower_scaffold" | "retention";

export function rebalanceTodayBudget({
  baseNewLimit,
  baseReviewLimit,
  dueCount,
}: {
  baseNewLimit: number;
  baseReviewLimit: number;
  dueCount: number;
}) {
  const transferableNewSlots = Math.floor(Math.max(0, baseNewLimit) / 2);
  const reviewOverflow = Math.max(0, dueCount - Math.max(0, baseReviewLimit));
  const shiftedSlots = Math.min(transferableNewSlots, reviewOverflow);
  return {
    newLimit: Math.max(0, baseNewLimit - shiftedSlots),
    reviewLimit: Math.max(0, baseReviewLimit + shiftedSlots),
    shiftedSlots,
  };
}

export function learnerMemoryPriority(state: AbilityState | null | undefined) {
  if (state === "weak") return 3;
  if (state === "unknown" || !state) return 2;
  if (state === "developing") return 1;
  return 0;
}

export function adaptiveRetestPriority(purpose: TodayRetestPurpose | null | undefined) {
  if (purpose === "lower_scaffold") return 3;
  if (purpose === "quick_confirmation") return 2;
  if (purpose === "retention") return 1;
  return 0;
}
