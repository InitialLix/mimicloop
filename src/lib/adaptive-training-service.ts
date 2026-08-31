import {
  selectNextTrainingAction,
  type ApprovedAdaptiveExercises,
} from "../domain/learner-model/adaptive-policy";
import { reduceLearnerState } from "../domain/learner-model/learner-state-reducer";
import { buildCollocationUseExerciseRef, buildSentenceUseExerciseRef } from "../domain/practice/use-exercise-ref";
import type { SentenceCardData, CollocationData } from "./content-types";
import {
  AdaptiveTrainingRepository,
  type AdaptiveTriggerKind,
} from "../db/adaptive-training-repository";
import type { SqliteConnection } from "../db/client";
import { LearningEvidenceRepository, LOCAL_LEARNER_ID } from "../db/learning-evidence-repository";
import { UseEvaluationRepository } from "../db/use-evaluation-repository";
import {
  summarizeCorrectionPath,
  type CorrectionObservationV1,
} from "../domain/learner-model/correction-path";

type AttemptContext = {
  assetId: string;
  exerciseType: string;
  completedAt: string;
};

function attemptContext(connection: SqliteConnection, triggerKind: AdaptiveTriggerKind, attemptId: string) {
  const sentence = triggerKind === "sentence_attempt";
  const sql = sentence
    ? `SELECT card_id AS assetId, exercise_type AS exerciseType, completed_at AS completedAt
       FROM attempts WHERE id = ?`
    : `SELECT collocation_id AS assetId, exercise_type AS exerciseType, completed_at AS completedAt
       FROM collocation_attempts WHERE id = ?`;
  const row = connection.sqlite.prepare(sql).get(attemptId) as AttemptContext | undefined;
  if (!row) throw new Error(`Unknown adaptive trigger: ${triggerKind}:${attemptId}`);
  if (row.exerciseType === "translation_recall") throw new Error("Adaptive v1 only accepts formal Use attempts");
  return row;
}

function approvedExercises(
  connection: SqliteConnection,
  triggerKind: AdaptiveTriggerKind,
  assetId: string,
): ApprovedAdaptiveExercises {
  if (triggerKind === "sentence_attempt") {
    const row = connection.sqlite.prepare("SELECT raw_json AS rawJson FROM cards WHERE id = ? AND content_status = 'approved'")
      .get(assetId) as { rawJson: string } | undefined;
    if (!row) return {};
    const card = JSON.parse(row.rawJson) as SentenceCardData;
    return {
      ...(card.exercise_seed.guided_application
        ? { guidedUse: { assetId, exerciseId: buildSentenceUseExerciseRef(card, "guided_application") } }
        : {}),
      ...(card.exercise_seed.slot_replacement?.length
        ? { crossTopicUse: { assetId, exerciseId: buildSentenceUseExerciseRef(card, "slot_replacement") } }
        : {}),
    };
  }

  const row = connection.sqlite.prepare(
    "SELECT raw_json AS rawJson FROM collocations WHERE id = ? AND content_status = 'approved' AND learning_mode = 'recall_use'",
  ).get(assetId) as { rawJson: string } | undefined;
  if (!row) return {};
  const collocation = JSON.parse(row.rawJson) as CollocationData;
  const exercise = collocation.exercise_seed.guided_application;
  if (!exercise) return {};
  const value = { assetId, exerciseId: buildCollocationUseExerciseRef(collocation) };
  return exercise.transfer_type === "cross_topic" ? { crossTopicUse: value } : { guidedUse: value };
}

function correctionPath(connection: SqliteConnection, attemptId: string) {
  const repository = new UseEvaluationRepository(connection);
  const history: CorrectionObservationV1[] = [];
  const visited = new Set<string>();
  let current = repository.get(attemptId);
  const finalExerciseRef = current?.exerciseRef ?? null;

  while (current && !visited.has(current.attemptId) && history.length < 3) {
    if (finalExerciseRef && current.exerciseRef !== finalExerciseRef) break;
    visited.add(current.attemptId);
    if (current.evaluation) {
      history.push({ verdict: current.evaluation.verdict, errors: current.evaluation.errors });
    }
    current = current.previousAttemptId ? repository.get(current.previousAttemptId) : null;
  }

  return summarizeCorrectionPath(history.reverse());
}

export function selectAndRecordAdaptiveNextStep(
  connection: SqliteConnection,
  input: { triggerKind: AdaptiveTriggerKind; attemptId: string },
) {
  const repository = new AdaptiveTrainingRepository(connection);
  const existing = repository.getByTrigger(input.triggerKind, input.attemptId);
  if (existing) return existing;

  const trigger = attemptContext(connection, input.triggerKind, input.attemptId);
  const evidenceRepository = new LearningEvidenceRepository(connection);
  evidenceRepository.syncAttempt(input.triggerKind, input.attemptId);
  const evidence = evidenceRepository.listEvidence()
    .filter((item) => item.assetId === trigger.assetId && item.occurredAt <= trigger.completedAt);
  const learnerState = reduceLearnerState(evidence);
  if (!learnerState) throw new Error(`No learner state for adaptive trigger: ${input.attemptId}`);
  const decision = selectNextTrainingAction({
    assetId: trigger.assetId,
    learnerState,
    evidence,
    exercises: approvedExercises(connection, input.triggerKind, trigger.assetId),
    completedAt: trigger.completedAt,
    correctionPath: correctionPath(connection, input.attemptId),
  });
  return repository.record({
    learnerId: LOCAL_LEARNER_ID,
    triggerKind: input.triggerKind,
    triggerId: input.attemptId,
    assetId: trigger.assetId,
    assetType: learnerState.assetType,
    decision,
    createdAt: trigger.completedAt,
  }).decision;
}
