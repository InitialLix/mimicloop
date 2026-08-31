import { shanghaiDateKey } from "./schedule";

export type CollocationDailyItem = { id: string };
export type CollocationDailyProgress = {
  collocationId: string;
  learningStage: string;
  dueAt: string;
  lastReviewedAt?: string | null;
  memoryPriority?: number;
  retestPriority?: number;
};
export type CollocationDailyAttempt = {
  collocationId: string;
  exerciseType: string;
  completedAt: string;
};

export function buildCollocationDailyPlan<TItem extends CollocationDailyItem>({
  collocations,
  progress,
  attempts,
  now,
  newItemLimit,
  reviewItemLimit,
  useRequiredAfter,
  useReadyIds,
  forcedDueIds = [],
}: {
  collocations: TItem[];
  progress: CollocationDailyProgress[];
  attempts: CollocationDailyAttempt[];
  now: Date;
  newItemLimit: number;
  reviewItemLimit: number;
  useRequiredAfter: string;
  useReadyIds: string[];
  forcedDueIds?: string[];
}) {
  const todayKey = shanghaiDateKey(now);
  const todayAttempts = attempts.filter((attempt) => shanghaiDateKey(new Date(attempt.completedAt)) === todayKey);
  const useReadySet = new Set(useReadyIds);
  const attemptedTodayIds = Array.from(new Set(todayAttempts.map((attempt) => attempt.collocationId)));
  const completedSet = new Set(todayAttempts
    .filter((attempt) => new Date(attempt.completedAt) < new Date(useRequiredAfter)
      || attempt.exerciseType === "guided_application"
      || (!useReadySet.has(attempt.collocationId) && attempt.exerciseType === "translation_recall"))
    .map((attempt) => attempt.collocationId));
  const attemptedTodaySet = new Set(attemptedTodayIds);
  const everAttemptedSet = new Set(attempts.map((attempt) => attempt.collocationId));
  const previouslyAttemptedSet = new Set(attempts
    .filter((attempt) => shanghaiDateKey(new Date(attempt.completedAt)) < todayKey)
    .map((attempt) => attempt.collocationId));
  const progressMap = new Map(progress.map((item) => [item.collocationId, item]));
  const forcedDueSet = new Set(forcedDueIds);
  const itemMap = new Map(collocations.map((item) => [item.id, item]));
  const attemptedItems = attemptedTodayIds
    .map((id) => itemMap.get(id))
    .filter((item): item is TItem => Boolean(item));
  const attemptedReviewCount = attemptedTodayIds.filter((id) => previouslyAttemptedSet.has(id)).length;
  const attemptedNewCount = attemptedTodayIds.length - attemptedReviewCount;

  const dueItems = collocations.filter((item) => {
    const state = progressMap.get(item.id);
    return !attemptedTodaySet.has(item.id)
      && everAttemptedSet.has(item.id)
      && state?.learningStage !== "new"
      && (forcedDueSet.has(item.id) || new Date(state?.dueAt ?? 0) <= now);
  }).sort((left, right) => {
    const leftState = progressMap.get(left.id);
    const rightState = progressMap.get(right.id);
    const retestDifference = (rightState?.retestPriority ?? 0) - (leftState?.retestPriority ?? 0);
    if (retestDifference) return retestDifference;
    const dueDifference = Date.parse(leftState?.dueAt ?? "") - Date.parse(rightState?.dueAt ?? "");
    if (Number.isFinite(dueDifference) && dueDifference) return dueDifference;
    const lastReviewedDifference = Date.parse(leftState?.lastReviewedAt ?? "1970-01-01T00:00:00.000Z")
      - Date.parse(rightState?.lastReviewedAt ?? "1970-01-01T00:00:00.000Z");
    if (Number.isFinite(lastReviewedDifference) && lastReviewedDifference) return lastReviewedDifference;
    const memoryDifference = (rightState?.memoryPriority ?? 0) - (leftState?.memoryPriority ?? 0);
    return memoryDifference || left.id.localeCompare(right.id);
  });
  const newItems = collocations.filter((item) => {
    const state = progressMap.get(item.id);
    return !attemptedTodaySet.has(item.id)
      && !everAttemptedSet.has(item.id)
      && (state?.learningStage === "new" || state?.learningStage === "learned");
  });
  const selectedDue = dueItems.slice(0, Math.max(0, reviewItemLimit - attemptedReviewCount));
  const selectedNew = newItems.slice(0, Math.max(0, newItemLimit - attemptedNewCount));
  const pending: TItem[] = [];
  const pendingLength = Math.max(selectedDue.length, selectedNew.length);
  for (let index = 0; index < pendingLength; index += 1) {
    if (selectedDue[index]) pending.push(selectedDue[index]);
    if (selectedNew[index]) pending.push(selectedNew[index]);
  }
  const queue = [...attemptedItems, ...pending];
  const dueIds = new Set([
    ...attemptedTodayIds.filter((id) => previouslyAttemptedSet.has(id)),
    ...selectedDue.map((item) => item.id),
  ]);
  const newIds = new Set([
    ...attemptedTodayIds.filter((id) => !previouslyAttemptedSet.has(id)),
    ...selectedNew.map((item) => item.id),
  ]);

  const completedIds = queue.filter((item) => completedSet.has(item.id)).map((item) => item.id);
  const recallCompletedIds = queue
    .filter((item) => useReadySet.has(item.id) && !completedSet.has(item.id) && todayAttempts.some(
      (attempt) => attempt.collocationId === item.id && attempt.exerciseType === "translation_recall",
    ))
    .map((item) => item.id);

  return {
    queue,
    completedIds,
    recallCompletedIds,
    completedCount: completedIds.length,
    dueCount: queue.filter((item) => dueIds.has(item.id)).length,
    newCount: queue.filter((item) => newIds.has(item.id)).length,
    newIds: Array.from(newIds),
    dueIds: Array.from(dueIds),
    newItemLimit,
    reviewItemLimit,
    todayKey,
  };
}
