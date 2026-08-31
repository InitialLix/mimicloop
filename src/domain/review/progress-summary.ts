import type { SentenceCardData } from "../../lib/content-types";
import { shanghaiDateKey } from "./schedule";

export type ProgressCard = Pick<
  SentenceCardData,
  "id" | "learning_sentence" | "translation_zh" | "primary_focus" | "topics"
>;

export type ProgressReviewState = {
  cardId: string;
  learningStage: string;
  dueAt: string;
};

export type ProgressAttempt = {
  cardId: string;
  exerciseType: string;
  selfRating: string;
  completedAt: string;
};

const stageKeys = ["new", "learned", "recall", "use"] as const;
const focusKeys = ["structure", "vocabulary", "mixed"] as const;
const useExerciseTypes = new Set(["slot_replacement", "guided_application"]);

function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function completesLearningCycle(attempt: ProgressAttempt, useRequiredAfter: string) {
  return new Date(attempt.completedAt) < new Date(useRequiredAfter)
    || useExerciseTypes.has(attempt.exerciseType);
}

export function buildProgressSummary({
  cards,
  reviewStates,
  attempts,
  now,
  useRequiredAfter,
}: {
  cards: ProgressCard[];
  reviewStates: ProgressReviewState[];
  attempts: ProgressAttempt[];
  now: Date;
  useRequiredAfter: string;
}) {
  const todayKey = shanghaiDateKey(now);
  const activityKeys = Array.from({ length: 7 }, (_, index) => shiftDateKey(todayKey, index - 6));
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const stateMap = new Map(reviewStates.map((state) => [state.cardId, state]));
  const attemptedIds = new Set(attempts.map((attempt) => attempt.cardId));
  const practicedIds = new Set(cards
    .filter((card) => attemptedIds.has(card.id) || stateMap.get(card.id)?.learningStage !== "new")
    .map((card) => card.id));

  const stageCounts: Record<(typeof stageKeys)[number], number> = {
    new: 0,
    learned: 0,
    recall: 0,
    use: 0,
  };
  for (const card of cards) {
    const storedStage = stateMap.get(card.id)?.learningStage;
    const stage = storedStage === "use" || storedStage === "recall" || storedStage === "learned"
      ? storedStage
      : attemptedIds.has(card.id) ? "learned" : "new";
    stageCounts[stage] += 1;
  }

  const completionSets = new Map(activityKeys.map((dateKey) => [dateKey, new Set<string>()]));
  for (const attempt of attempts) {
    if (!completesLearningCycle(attempt, useRequiredAfter)) continue;
    completionSets.get(shanghaiDateKey(new Date(attempt.completedAt)))?.add(attempt.cardId);
  }
  const activity = activityKeys.map((dateKey) => ({
    dateKey,
    count: completionSets.get(dateKey)?.size ?? 0,
  }));

  const focusStats = focusKeys.map((focus) => {
    const focusCards = cards.filter((card) => card.primary_focus === focus);
    return {
      focus,
      total: focusCards.length,
      practiced: focusCards.filter((card) => practicedIds.has(card.id)).length,
    };
  });

  const topicMap = new Map<string, { topic: string; total: number; practiced: number }>();
  for (const card of cards) {
    for (const topic of card.topics) {
      const current = topicMap.get(topic) ?? { topic, total: 0, practiced: 0 };
      current.total += 1;
      if (practicedIds.has(card.id)) current.practiced += 1;
      topicMap.set(topic, current);
    }
  }
  const topicStats = Array.from(topicMap.values()).sort(
    (left, right) => right.practiced - left.practiced || right.total - left.total || left.topic.localeCompare(right.topic),
  );

  const latestAttemptByCard = new Map<string, ProgressAttempt>();
  for (const attempt of [...attempts].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  )) {
    if (!latestAttemptByCard.has(attempt.cardId)) latestAttemptByCard.set(attempt.cardId, attempt);
  }
  const recentCards = Array.from(latestAttemptByCard.values())
    .map((attempt) => ({ card: cardMap.get(attempt.cardId), attempt }))
    .filter((item): item is { card: ProgressCard; attempt: ProgressAttempt } => Boolean(item.card))
    .slice(0, 5)
    .map(({ card, attempt }) => ({
      ...card,
      completedAt: attempt.completedAt,
      selfRating: attempt.selfRating,
    }));

  return {
    totalCards: cards.length,
    practicedCards: practicedIds.size,
    stageCounts,
    completedToday: activity.at(-1)?.count ?? 0,
    completedLast7Days: activity.reduce((sum, item) => sum + item.count, 0),
    activity,
    todayKey,
    focusStats,
    topicStats,
    recentCards,
  };
}
