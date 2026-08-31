export type SelfRating = "forgot" | "fuzzy" | "recalled" | "can_use";

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

export function shanghaiDateKey(date: Date) {
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function nextShanghaiDayStart(completedAt: Date) {
  const shanghai = new Date(completedAt.getTime() + SHANGHAI_OFFSET_MS);
  const nextLocalMidnightAsUtc = Date.UTC(
    shanghai.getUTCFullYear(),
    shanghai.getUTCMonth(),
    shanghai.getUTCDate() + 1,
  );
  return new Date(nextLocalMidnightAsUtc - SHANGHAI_OFFSET_MS);
}

export function nextReviewState(rating: SelfRating, completedAt: Date) {
  const dueAt = nextShanghaiDayStart(completedAt);
  return {
    learningStage: rating === "forgot" ? "learned" : rating === "can_use" ? "use" : "recall",
    successIncrement: rating === "recalled" || rating === "can_use" ? 1 : 0,
    resetStreak: rating === "forgot",
    intervalDays: 1,
    dueAt: dueAt.toISOString(),
  };
}
