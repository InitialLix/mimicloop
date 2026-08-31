import { shanghaiDateKey } from "./schedule";

export type DailyPlanCard = { id: string };
export type DailyPlanReviewState = {
  cardId: string;
  learningStage: string;
  dueAt: string;
  lastReviewedAt?: string | null;
  memoryPriority?: number;
  retestPriority?: number;
};
export type DailyPlanAttempt = {
  cardId: string;
  exerciseType: string;
  completedAt: string;
};

export function buildDailyPlan<TCard extends DailyPlanCard>({
  cards,
  reviewStates,
  attempts,
  now,
  newCardLimit,
  reviewCardLimit,
  useRequiredAfter,
  forcedDueIds = [],
}: {
  cards: TCard[];
  reviewStates: DailyPlanReviewState[];
  attempts: DailyPlanAttempt[];
  now: Date;
  newCardLimit: number;
  reviewCardLimit: number;
  useRequiredAfter: string;
  forcedDueIds?: string[];
}) {
  const todayKey = shanghaiDateKey(now);
  const todayAttempts = attempts.filter((attempt) => shanghaiDateKey(new Date(attempt.completedAt)) === todayKey);
  const previouslyAttemptedIds = new Set(attempts
    .filter((attempt) => shanghaiDateKey(new Date(attempt.completedAt)) < todayKey)
    .map((attempt) => attempt.cardId));
  const attemptedTodayIds = Array.from(new Set(todayAttempts.map((attempt) => attempt.cardId)));
  const attemptedSet = new Set(attemptedTodayIds);
  const useExerciseTypes = new Set(["slot_replacement", "guided_application"]);
  const completedSet = new Set(todayAttempts
    .filter((attempt) => new Date(attempt.completedAt) < new Date(useRequiredAfter) || useExerciseTypes.has(attempt.exerciseType))
    .map((attempt) => attempt.cardId));
  const stateMap = new Map(reviewStates.map((state) => [state.cardId, state]));
  const forcedDueSet = new Set(forcedDueIds);
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const attemptedCards = attemptedTodayIds
    .map((id) => cardMap.get(id))
    .filter((card): card is TCard => Boolean(card));
  const attemptedReviewIds = attemptedTodayIds.filter((id) => previouslyAttemptedIds.has(id));
  const attemptedNewIds = attemptedTodayIds.filter((id) => !previouslyAttemptedIds.has(id));
  const dueCards = cards.filter((card) => {
    const state = stateMap.get(card.id);
    return !attemptedSet.has(card.id)
      && state?.learningStage !== "new"
      && (forcedDueSet.has(card.id) || new Date(state?.dueAt ?? 0) <= now);
  }).sort((left, right) => {
    const leftState = stateMap.get(left.id);
    const rightState = stateMap.get(right.id);
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
  const newCards = cards.filter((card) => {
    const state = stateMap.get(card.id);
    return !attemptedSet.has(card.id) && state?.learningStage === "new";
  });
  const selectedDueCards = dueCards.slice(0, Math.max(0, reviewCardLimit - attemptedReviewIds.length));
  const selectedNewCards = newCards.slice(0, Math.max(0, newCardLimit - attemptedNewIds.length));
  const pendingCards: TCard[] = [];
  const pendingLength = Math.max(selectedDueCards.length, selectedNewCards.length);
  for (let index = 0; index < pendingLength; index += 1) {
    if (selectedDueCards[index]) pendingCards.push(selectedDueCards[index]);
    if (selectedNewCards[index]) pendingCards.push(selectedNewCards[index]);
  }
  const queue = [...attemptedCards, ...pendingCards];
  const dueIds = new Set([...attemptedReviewIds, ...selectedDueCards.map((card) => card.id)]);
  const newIds = new Set([...attemptedNewIds, ...selectedNewCards.map((card) => card.id)]);
  const completedIds = queue.filter((card) => completedSet.has(card.id)).map((card) => card.id);
  const recallCompletedIds = queue
    .filter((card) => !completedSet.has(card.id) && todayAttempts.some(
      (attempt) => attempt.cardId === card.id && attempt.exerciseType === "translation_recall",
    ))
    .map((card) => card.id);

  return {
    queue,
    completedIds,
    recallCompletedIds,
    completedCount: completedIds.length,
    dueCount: queue.filter((card) => dueIds.has(card.id)).length,
    newCount: queue.filter((card) => newIds.has(card.id)).length,
    newCardLimit,
    reviewCardLimit,
    todayKey,
  };
}
