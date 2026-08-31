import type { SqliteConnection } from "../db/client";
import {
  ContentRepository,
  loadApprovedCollocationSeed,
  loadCollocationCandidateSeed,
  loadSeedBundle,
} from "../db/content-repository";
import { buildDailyPlan } from "../domain/review/daily-plan";
import { buildCollocationDailyPlan } from "../domain/review/collocation-daily-plan";
import {
  adaptiveRetestPriority,
  learnerMemoryPriority,
  rebalanceTodayBudget,
  type TodayRetestPurpose,
} from "../domain/review/today-memory-policy";
import { buildProgressSummary, type ProgressAttempt, type ProgressReviewState } from "../domain/review/progress-summary";
import { applyCandidateReview, type CandidateReviewInput } from "../domain/content/candidate-review";
import { applyCollocationReview, type CollocationReviewInput } from "../domain/content/collocation-review";
import { collocationTaskKey, sentenceTaskKey, type StudyTaskDescriptor } from "../domain/review/study-navigation";
import { candidateValidationErrors, collocationValidationErrors } from "./content-validation";
import type {
  CandidateData,
  CollocationData,
  CollocationProgressData,
  SentenceCardData,
  SourceEssayData,
} from "./content-types";
import { LearningEvidenceRepository } from "../db/learning-evidence-repository";
import {
  isIndependentEvidence,
  type AbilityState,
  type AssetLearnerStateV1,
} from "../domain/learner-model/learning-evidence";
import { analyzeEssayTask } from "../domain/writing/task-analysis";
import { openAppDatabase } from "./app-database";
import { isCompetitionMode } from "./competition-mode";

async function withDatabase<T>(operation: (connection: SqliteConnection) => T): Promise<T> {
  const connection = await openAppDatabase();
  try {
    return operation(connection);
  } finally {
    connection.close();
  }
}

async function withRepository<T>(operation: (repository: ContentRepository) => T): Promise<T> {
  return withDatabase((connection) => operation(new ContentRepository(connection)));
}

export async function ensureSeededDatabase() {
  if (isCompetitionMode()) {
    const connection = await openAppDatabase();
    connection.close();
    return { content: null, collocations: null, approved: null };
  }
  const [bundle, collocationCandidates, approvedCollocations] = await Promise.all([
    loadSeedBundle(),
    loadCollocationCandidateSeed(),
    loadApprovedCollocationSeed(),
  ]);
  return withRepository((repository) => {
    const content = repository.importSeeds(bundle);
    const collocations = repository.importCollocationCandidates(collocationCandidates);
    const approved = repository.importApprovedCollocations(approvedCollocations);
    return { content, collocations, approved };
  });
}

export async function getLibraryData() {
  await ensureSeededDatabase();
  return withDatabase((connection) => {
    const repository = new ContentRepository(connection);
    const expressions = repository.listCollocations() as unknown as CollocationData[];
    const corpusSources = (repository.listSources() as unknown as SourceEssayData[])
      .filter((source) => source.content_role !== "guided_writing_prompt");
    return {
      cards: repository.listCards() as unknown as SentenceCardData[],
      sources: corpusSources,
      expressions,
      collocations: expressions.filter((item) => item.learning_mode === "recall_use"),
      appreciationExpressions: expressions.filter((item) => item.learning_mode === "appreciation"),
      collocationProgress: connection.sqlite
        .prepare(
          `SELECT collocation_id AS collocationId, learning_stage AS learningStage,
                  recall_score AS recallScore, application_score AS applicationScore,
                  success_streak AS successStreak, lapse_count AS lapseCount,
                  interval_days AS intervalDays, due_at AS dueAt,
                  last_reviewed_at AS lastReviewedAt, updated_at AS updatedAt
           FROM collocation_progress`,
        )
        .all() as CollocationProgressData[],
    };
  });
}

export async function getGuidedWritingPrompts() {
  await ensureSeededDatabase();
  return withRepository((repository) => (repository.listSources() as unknown as SourceEssayData[])
    .filter((source) => source.content_role !== "language_richness_corpus" && Boolean(source.ielts_prompt))
    .map(analyzeEssayTask));
}

export async function getCollocationLearningData(collocationId: string) {
  const library = await getLibraryData();
  const collocation = library.collocations.find((item) => item.id === collocationId) ?? null;
  if (!collocation) return null;
  return {
    collocation,
    sources: library.sources.filter((source) => collocation.source_links.some((link) => link.source_essay_id === source.id)),
    progress: library.collocationProgress.find((item) => item.collocationId === collocationId) ?? null,
  };
}

export async function getCandidates() {
  await ensureSeededDatabase();
  return withRepository((repository) => repository.listCandidates() as unknown as CandidateData[]);
}

export async function getCandidateReviewData(candidateId: string) {
  await ensureSeededDatabase();
  return withRepository((repository) => {
    const candidate = repository.getCandidate(candidateId) as unknown as CandidateData | null;
    if (!candidate) return null;
    const source = (repository.listSources() as unknown as SourceEssayData[])
      .find((item) => item.id === candidate.card.source_essay_id) ?? null;
    return { candidate, source };
  });
}

export async function submitCandidateReview(candidateId: string, input: CandidateReviewInput) {
  await ensureSeededDatabase();
  return withRepository((repository) => {
    const current = repository.getCandidate(candidateId) as unknown as CandidateData | null;
    if (!current) throw new Error("找不到这张候选卡。");
    const next = applyCandidateReview(current, input);
    const errors = candidateValidationErrors(next);
    if (errors.length) throw new Error(errors.join("\n"));
    repository.saveReviewedCandidate(next as unknown as Record<string, unknown>, input.action === "approve");
    return next;
  });
}

export async function getCollocationCandidates() {
  await ensureSeededDatabase();
  return withRepository((repository) => repository.listCollocationCandidates() as unknown as CollocationData[]);
}

export async function getCollocationCandidateReviewData(candidateId: string) {
  await ensureSeededDatabase();
  return withRepository((repository) => {
    const candidate = repository.getCollocationCandidate(candidateId) as unknown as CollocationData | null;
    if (!candidate) return null;
    const sourceIds = new Set(candidate.source_links.map((link) => link.source_essay_id));
    const sources = (repository.listSources() as unknown as SourceEssayData[])
      .filter((source) => sourceIds.has(source.id));
    const mergeTargets = (repository.listCollocations() as unknown as CollocationData[])
      .filter((item) => item.id !== candidate.id);
    return { candidate, sources, mergeTargets };
  });
}

export async function submitCollocationReview(candidateId: string, input: CollocationReviewInput) {
  await ensureSeededDatabase();
  return withRepository((repository) => {
    const current = repository.getCollocationCandidate(candidateId) as unknown as CollocationData | null;
    if (!current) throw new Error("找不到这条候选搭配。");
    const next = applyCollocationReview(current, input);
    const errors = collocationValidationErrors(next);
    if (errors.length) throw new Error(errors.join("\n"));
    repository.saveReviewedCollocationCandidate(next as unknown as Record<string, unknown>, input.action === "approve");
    return next;
  });
}

export async function getTodayStudyData(now = new Date()) {
  await ensureSeededDatabase();
  return withDatabase((connection) => {
    const repository = new ContentRepository(connection);
    const cards = repository.listCards() as unknown as SentenceCardData[];
    const baseReviewRows = connection.sqlite
      .prepare(
        `SELECT card_id AS cardId, learning_stage AS learningStage, due_at AS dueAt,
                last_reviewed_at AS lastReviewedAt FROM review_states`,
      )
      .all() as Array<{ cardId: string; learningStage: string; dueAt: string; lastReviewedAt: string | null }>;
    const attempts = connection.sqlite
      .prepare("SELECT card_id AS cardId, exercise_type AS exerciseType, completed_at AS completedAt FROM attempts ORDER BY completed_at")
      .all() as Array<{ cardId: string; exerciseType: string; completedAt: string }>;
    const setting = connection.sqlite
      .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'daily_new_card_limit'")
      .get() as { valueJson: string } | undefined;
    const newCardLimit = setting ? Number(JSON.parse(setting.valueJson)) : 5;
    const baseReviewCardLimit = newCardLimit;
    const adaptiveUseSetting = connection.sqlite
      .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'adaptive_use_started_at'")
      .get() as { valueJson: string } | undefined;
    const useRequiredAfter = adaptiveUseSetting ? String(JSON.parse(adaptiveUseSetting.valueJson)) : now.toISOString();
    if (!adaptiveUseSetting) {
      connection.sqlite
        .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
        .run("adaptive_use_started_at", JSON.stringify(useRequiredAfter), useRequiredAfter);
    }
    const collocations = (repository.listCollocations() as unknown as CollocationData[])
      .filter((item) => item.learning_mode === "recall_use");
    const baseCollocationProgress = connection.sqlite
      .prepare(
        `SELECT collocation_id AS collocationId, learning_stage AS learningStage, due_at AS dueAt,
                last_reviewed_at AS lastReviewedAt FROM collocation_progress`,
      )
      .all() as Array<{
        collocationId: string;
        learningStage: string;
        dueAt: string;
        lastReviewedAt: string | null;
      }>;
    const collocationAttempts = connection.sqlite
      .prepare("SELECT collocation_id AS collocationId, exercise_type AS exerciseType, completed_at AS completedAt FROM collocation_attempts ORDER BY completed_at")
      .all() as Array<{ collocationId: string; exerciseType: string; completedAt: string }>;
    const collocationUseSetting = connection.sqlite
      .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'collocation_use_started_at'")
      .get() as { valueJson: string } | undefined;
    const collocationUseRequiredAfter = collocationUseSetting
      ? String(JSON.parse(collocationUseSetting.valueJson))
      : now.toISOString();
    if (!collocationUseSetting) {
      connection.sqlite
        .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
        .run("collocation_use_started_at", JSON.stringify(collocationUseRequiredAfter), collocationUseRequiredAfter);
    }
    const collocationNewLimit = 10;
    const baseCollocationReviewLimit = 10;
    const latestSentenceUse = new Map<string, string>();
    for (const attempt of attempts) {
      if (attempt.exerciseType !== "translation_recall") latestSentenceUse.set(attempt.cardId, attempt.completedAt);
    }
    const latestCollocationUse = new Map<string, string>();
    for (const attempt of collocationAttempts) {
      if (attempt.exerciseType !== "translation_recall") latestCollocationUse.set(attempt.collocationId, attempt.completedAt);
    }
    const retestRows = connection.sqlite.prepare(
      `SELECT asset_id AS assetId, asset_type AS assetType, purpose, due_at AS dueAt,
              created_at AS createdAt
       FROM adaptive_retests WHERE status = 'scheduled' AND due_at <= ?
       ORDER BY due_at, id`,
    ).all(now.toISOString()) as Array<{
      assetId: string;
      assetType: "collocation" | "sentence_pattern" | "fixed_phrase";
      purpose: TodayRetestPurpose;
      dueAt: string;
      createdAt: string;
    }>;
    const activeRetestByAsset = new Map<string, typeof retestRows[number]>();
    for (const retest of retestRows) {
      const latestUse = retest.assetType === "collocation"
        ? latestCollocationUse.get(retest.assetId)
        : latestSentenceUse.get(retest.assetId);
      if (latestUse && Date.parse(latestUse) > Date.parse(retest.createdAt)) continue;
      const current = activeRetestByAsset.get(retest.assetId);
      if (!current || adaptiveRetestPriority(retest.purpose) > adaptiveRetestPriority(current.purpose)) {
        activeRetestByAsset.set(retest.assetId, retest);
      }
    }
    const learnerStateMap = new Map(
      new LearningEvidenceRepository(connection).getLearnerStates().map((state) => [state.assetId, state]),
    );
    const abilityForToday = (state: AssetLearnerStateV1 | undefined) => {
      if (!state) return null;
      if (state.transferUse !== "unknown") return state.transferUse;
      if (state.guidedUse !== "unknown") return state.guidedUse;
      return state.recall;
    };
    const reviewRows = baseReviewRows.map((row) => ({
      ...row,
      memoryPriority: learnerMemoryPriority(abilityForToday(learnerStateMap.get(row.cardId))),
      retestPriority: adaptiveRetestPriority(activeRetestByAsset.get(row.cardId)?.purpose),
    }));
    const collocationProgress = baseCollocationProgress.map((row) => ({
      ...row,
      memoryPriority: learnerMemoryPriority(abilityForToday(learnerStateMap.get(row.collocationId))),
      retestPriority: adaptiveRetestPriority(activeRetestByAsset.get(row.collocationId)?.purpose),
    }));
    const sentenceForcedDueIds = Array.from(activeRetestByAsset.values())
      .filter((item) => item.assetType !== "collocation")
      .map((item) => item.assetId);
    const collocationForcedDueIds = Array.from(activeRetestByAsset.values())
      .filter((item) => item.assetType === "collocation")
      .map((item) => item.assetId);
    const sentenceForcedDueSet = new Set(sentenceForcedDueIds);
    const collocationForcedDueSet = new Set(collocationForcedDueIds);
    const sentenceDueCount = reviewRows.filter((row) => (
      row.learningStage !== "new"
      && (sentenceForcedDueSet.has(row.cardId) || Date.parse(row.dueAt) <= now.getTime())
    )).length;
    const attemptedCollocationIds = new Set(collocationAttempts.map((attempt) => attempt.collocationId));
    const collocationDueCount = collocationProgress.filter((row) => (
      row.learningStage !== "new"
      && attemptedCollocationIds.has(row.collocationId)
      && (collocationForcedDueSet.has(row.collocationId) || Date.parse(row.dueAt) <= now.getTime())
    )).length;
    const sentenceBudget = rebalanceTodayBudget({
      baseNewLimit: newCardLimit,
      baseReviewLimit: baseReviewCardLimit,
      dueCount: sentenceDueCount,
    });
    const collocationBudget = rebalanceTodayBudget({
      baseNewLimit: collocationNewLimit,
      baseReviewLimit: baseCollocationReviewLimit,
      dueCount: collocationDueCount,
    });
    const sentencePlan = buildDailyPlan({
      cards,
      reviewStates: reviewRows,
      attempts,
      now,
      newCardLimit: sentenceBudget.newLimit,
      reviewCardLimit: sentenceBudget.reviewLimit,
      useRequiredAfter,
      forcedDueIds: sentenceForcedDueIds,
    });
    const collocationPlan = buildCollocationDailyPlan({
      collocations,
      progress: collocationProgress,
      attempts: collocationAttempts,
      now,
      newItemLimit: collocationBudget.newLimit,
      reviewItemLimit: collocationBudget.reviewLimit,
      useRequiredAfter: collocationUseRequiredAfter,
      useReadyIds: collocations
        .filter((item) => Boolean(item.exercise_seed.guided_application))
        .map((item) => item.id),
      forcedDueIds: collocationForcedDueIds,
    });

    type TodaySentenceTask = StudyTaskDescriptor & {
      kind: "sentence";
      card: SentenceCardData;
      completed: boolean;
    };
    type TodayCollocationTask = StudyTaskDescriptor & {
      kind: "collocation";
      collocation: CollocationData;
      completed: boolean;
    };
    const sentenceTasks: TodaySentenceTask[] = sentencePlan.queue.map((card) => ({
      key: sentenceTaskKey(card.id),
      kind: "sentence",
      id: card.id,
      card,
      isNew: sentencePlan.newCount > 0 && reviewRows.find((row) => row.cardId === card.id)?.learningStage === "new",
      recallCompleted: sentencePlan.recallCompletedIds.includes(card.id),
      completed: sentencePlan.completedIds.includes(card.id),
    }));
    const collocationTasks: TodayCollocationTask[] = collocationPlan.queue.map((collocation) => ({
      key: collocationTaskKey(collocation.id),
      kind: "collocation",
      id: collocation.id,
      collocation,
      isNew: collocationPlan.newIds.includes(collocation.id),
      recallCompleted: collocationPlan.recallCompletedIds.includes(collocation.id),
      requiresUse: Boolean(collocation.exercise_seed.guided_application),
      completed: collocationPlan.completedIds.includes(collocation.id),
    }));
    const queue: Array<TodaySentenceTask | TodayCollocationTask> = [];
    const queueLength = Math.max(sentenceTasks.length, collocationTasks.length);
    for (let index = 0; index < queueLength; index += 1) {
      if (sentenceTasks[index]) queue.push(sentenceTasks[index]);
      if (collocationTasks[index]) queue.push(collocationTasks[index]);
    }
    const completedTaskKeys = queue.filter((task) => task.completed).map((task) => task.key);

    return {
      queue,
      taskDescriptors: queue.map(({ key, kind, id, isNew, recallCompleted, requiresUse }) => ({ key, kind, id, isNew, recallCompleted, requiresUse })),
      completedTaskKeys,
      completedCount: completedTaskKeys.length,
      dueCount: sentencePlan.dueCount + collocationPlan.dueCount,
      newCount: sentencePlan.newCount + collocationPlan.newCount,
      newSentenceCount: sentencePlan.newCount,
      newCollocationCount: collocationPlan.newCount,
      dueSentenceCount: sentencePlan.dueCount,
      dueCollocationCount: collocationPlan.dueCount,
      sentencePlan,
      collocationPlan,
      memoryAdjustment: {
        sentenceShiftedSlots: sentenceBudget.shiftedSlots,
        collocationShiftedSlots: collocationBudget.shiftedSlots,
        activeRetestCount: activeRetestByAsset.size,
      },
    };
  });
}

export async function getProgressData(now = new Date()) {
  await ensureSeededDatabase();
  return withDatabase((connection) => {
    const repository = new ContentRepository(connection);
    const cards = repository.listCards() as unknown as SentenceCardData[];
    const reviewStates = connection.sqlite
      .prepare("SELECT card_id AS cardId, learning_stage AS learningStage, due_at AS dueAt FROM review_states")
      .all() as ProgressReviewState[];
    const attempts = connection.sqlite
      .prepare(
        `SELECT card_id AS cardId, exercise_type AS exerciseType,
                self_rating AS selfRating, completed_at AS completedAt
         FROM attempts
         ORDER BY completed_at DESC`,
      )
      .all() as ProgressAttempt[];
    const adaptiveUseSetting = connection.sqlite
      .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'adaptive_use_started_at'")
      .get() as { valueJson: string } | undefined;
    const useRequiredAfter = adaptiveUseSetting
      ? String(JSON.parse(adaptiveUseSetting.valueJson))
      : now.toISOString();

    const summary = buildProgressSummary({ cards, reviewStates, attempts, now, useRequiredAfter });
    const evidenceRepository = new LearningEvidenceRepository(connection);
    evidenceRepository.syncAllAttempts();
    const learnerStates = evidenceRepository.getLearnerStates();
    const collocations = repository.listCollocations() as unknown as CollocationData[];
    const cardMap = new Map(cards.map((card) => [card.id, card]));
    const collocationMap = new Map(collocations.map((item) => [item.id, item]));
    const dimensions = ["recall", "guidedUse", "transferUse", "delayedRetention"] as const;
    const initialCounts = () => ({ unknown: 0, weak: 0, developing: 0, stable: 0 } satisfies Record<AbilityState, number>);
    const stateCounts = Object.fromEntries(dimensions.map((dimension) => [dimension, initialCounts()])) as
      Record<typeof dimensions[number], Record<AbilityState, number>>;
    for (const state of learnerStates) {
      for (const dimension of dimensions) stateCounts[dimension][state[dimension]] += 1;
    }

    return {
      ...summary,
      learnerProfile: {
        evidenceCount: evidenceRepository.count(),
        assessedAssets: learnerStates.length,
        stateCounts,
        recentAssets: learnerStates.slice(0, 8).map((state) => {
          const card = cardMap.get(state.assetId);
          const collocation = collocationMap.get(state.assetId);
          return {
            ...state,
            label: card?.learning_sentence ?? collocation?.canonical_text ?? state.assetId,
            translation: card?.translation_zh ?? collocation?.translation_prompt ?? "",
            href: card ? `/progress/sentence/${state.assetId}` : `/progress/collocation/${state.assetId}`,
          };
        }),
      },
    };
  });
}

export async function getLearnerAssetDetail(assetId: string) {
  await ensureSeededDatabase();
  return withDatabase((connection) => {
    const repository = new ContentRepository(connection);
    const card = (repository.listCards() as unknown as SentenceCardData[]).find((item) => item.id === assetId);
    const collocation = (repository.listCollocations() as unknown as CollocationData[]).find((item) => item.id === assetId);
    if (!card && !collocation) return null;

    const evidenceRepository = new LearningEvidenceRepository(connection);
    evidenceRepository.syncAllAttempts();
    const state = evidenceRepository.getLearnerStates().find((item) => item.assetId === assetId);
    if (!state) return null;

    const attemptRows = (card
      ? connection.sqlite.prepare(
        `SELECT id, self_rating AS selfRating, user_answer AS userAnswer
         FROM attempts WHERE card_id = ?`,
      ).all(assetId)
      : connection.sqlite.prepare(
        `SELECT id, self_rating AS selfRating, user_answer AS userAnswer
         FROM collocation_attempts WHERE collocation_id = ?`,
      ).all(assetId)) as Array<{ id: string; selfRating: string; userAnswer: string }>;
    const attemptMap = new Map(attemptRows.map((item) => [item.id, item]));
    const evidence = evidenceRepository.listEvidence()
      .filter((item) => item.assetId === assetId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .map((item) => ({
        ...item,
        independent: isIndependentEvidence(item),
        selfRating: attemptMap.get(item.context.attemptId)?.selfRating ?? null,
        userAnswer: attemptMap.get(item.context.attemptId)?.userAnswer ?? null,
      }));
    const sentenceChunks = card?.chunks.map((item) => item.text).join(" / ") ?? "";
    const trainingTargetLabel = card
      ? card.primary_focus === "vocabulary" ? "目标表达" : card.primary_focus === "mixed" ? "结构与表达" : "可复用结构"
      : "目标搭配";
    const trainingTarget = card
      ? card.primary_focus === "vocabulary"
        ? sentenceChunks || card.learning_sentence
        : [card.pattern, card.primary_focus === "mixed" ? sentenceChunks : null].filter(Boolean).join(" · ") || card.learning_sentence
      : collocation!.canonical_text;

    return {
      kind: card ? "sentence" as const : "collocation" as const,
      assetId,
      label: card?.learning_sentence ?? collocation!.canonical_text,
      translation: card?.translation_zh ?? collocation!.translation_prompt,
      trainingTargetLabel,
      trainingTarget,
      state,
      evidence,
      learningHref: card ? `/library/${assetId}` : `/library/collocations/${assetId}`,
      recallHref: card ? `/practice/${assetId}/recall?from=progress` : `/practice/collocations/${assetId}/recall?from=progress`,
      useHref: card
        ? `/practice/${assetId}/use?from=progress`
        : collocation!.learning_mode === "recall_use" ? `/practice/collocations/${assetId}/use?from=progress` : null,
    };
  });
}
