import { randomUUID } from "node:crypto";
import type { SelfRating } from "../domain/review/schedule";
import { nextReviewState } from "../domain/review/schedule";
import {
  matchCollocationAnswer,
  normalizeCollocationAnswer,
} from "../domain/review/collocation-recall";
import type { SqliteConnection } from "./client";
import { LearningEvidenceRepository } from "./learning-evidence-repository";

export interface TranslationRecallAttempt {
  cardId: string;
  promptSnapshot: string;
  userAnswer: string;
  selfRating: SelfRating;
  hintUsed: boolean;
  durationMs: number | null;
  completedAt?: string;
}

export interface UseAttempt extends TranslationRecallAttempt {
  attemptId?: string;
  exerciseType: "slot_replacement" | "guided_application";
}

export interface CollocationRecallAttempt {
  collocationId: string;
  promptSnapshot: string;
  userAnswer: string;
  selfRating: SelfRating;
  hintUsed: boolean;
  durationMs: number | null;
  completedAt?: string;
}

export interface CollocationUseAttempt extends CollocationRecallAttempt {
  attemptId?: string;
  exerciseType: "guided_application";
}

export class AttemptIdConflictError extends Error {}

export class LearningRepository {
  constructor(private readonly connection: SqliteConnection) {}

  recordTranslationRecall(input: TranslationRecallAttempt) {
    return this.recordAttempt({ ...input, exerciseType: "translation_recall" }, false);
  }

  recordUseAttempt(input: UseAttempt) {
    return this.recordAttempt(input, true);
  }

  markCollocationLearned(collocationId: string, learnedAt = new Date().toISOString()) {
    const result = this.connection.sqlite
      .prepare(
        `UPDATE collocation_progress
         SET learning_stage = CASE WHEN learning_stage = 'new' THEN 'learned' ELSE learning_stage END,
             due_at = CASE WHEN learning_stage = 'new' THEN ? ELSE due_at END,
             updated_at = ?
         WHERE collocation_id = ?`,
      )
      .run(learnedAt, learnedAt, collocationId);
    if (!result.changes) throw new Error(`Unknown collocation: ${collocationId}`);
    return { collocationId, learningStage: "learned", learnedAt };
  }

  recordCollocationRecall(input: CollocationRecallAttempt) {
    const completedAt = input.completedAt ?? new Date().toISOString();
    const attemptId = randomUUID();
    const ratingScore = { forgot: 0, fuzzy: 0.4, recalled: 0.75, can_use: 1 }[input.selfRating];

    let matchResult: "canonical" | "accepted" | "unmatched" = "unmatched";
    this.connection.sqlite.transaction(() => {
      const row = this.connection.sqlite
        .prepare("SELECT canonical_text AS canonicalText, raw_json AS rawJson FROM collocations WHERE id = ? AND learning_mode = 'recall_use'")
        .get(input.collocationId) as { canonicalText: string; rawJson: string } | undefined;
      if (!row) throw new Error(`Unknown collocation: ${input.collocationId}`);
      const content = JSON.parse(row.rawJson) as { accepted_answers?: unknown };
      const acceptedAnswers = Array.isArray(content.accepted_answers)
        ? content.accepted_answers.filter((value): value is string => typeof value === "string")
        : [row.canonicalText];
      matchResult = matchCollocationAnswer({
        answer: input.userAnswer,
        canonical: row.canonicalText,
        acceptedAnswers,
      });
      const previous = this.connection.sqlite
        .prepare("SELECT COUNT(*) AS count FROM collocation_attempts WHERE collocation_id = ? AND exercise_type = 'translation_recall'")
        .get(input.collocationId) as { count: number };
      this.connection.sqlite
        .prepare(
          `INSERT INTO collocation_attempts
           (id, collocation_id, exercise_type, prompt_snapshot, user_answer, normalized_answer,
            match_result, self_rating, hint_used, attempt_count, duration_ms, completed_at)
           VALUES (?, ?, 'translation_recall', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          attemptId,
          input.collocationId,
          input.promptSnapshot,
          input.userAnswer,
          normalizeCollocationAnswer(input.userAnswer),
          matchResult,
          input.selfRating,
          input.hintUsed ? 1 : 0,
          previous.count + 1,
          input.durationMs,
          completedAt,
        );
      this.connection.sqlite
        .prepare(
          `UPDATE collocation_progress SET
             learning_stage = 'recall', recall_score = ?, updated_at = ?
           WHERE collocation_id = ?`,
        )
        .run(ratingScore, completedAt, input.collocationId);
      new LearningEvidenceRepository(this.connection).syncAttempt("collocation_attempt", attemptId);
    })();

    return {
      attemptId,
      completedAt,
      normalizedAnswer: normalizeCollocationAnswer(input.userAnswer),
      matchResult,
    };
  }

  recordCollocationUse(input: CollocationUseAttempt) {
    const completedAt = input.completedAt ?? new Date().toISOString();
    const attemptId = input.attemptId ?? randomUUID();
    const next = nextReviewState(input.selfRating, new Date(completedAt));
    const applicationScore = { forgot: 0, fuzzy: 0.4, recalled: 0.75, can_use: 1 }[input.selfRating];
    let duplicate = false;
    let storedCompletedAt: string | null = null;
    this.connection.sqlite.transaction(() => {
      const collocation = this.connection.sqlite
        .prepare("SELECT 1 FROM collocations WHERE id = ? AND learning_mode = 'recall_use'")
        .get(input.collocationId);
      if (!collocation) throw new Error(`Unknown collocation: ${input.collocationId}`);
      const existing = this.connection.sqlite
        .prepare(
          `SELECT collocation_id AS collocationId, exercise_type AS exerciseType,
                  prompt_snapshot AS promptSnapshot, user_answer AS userAnswer,
                  self_rating AS selfRating, hint_used AS hintUsed, completed_at AS completedAt
           FROM collocation_attempts WHERE id = ?`,
        )
        .get(attemptId) as {
          collocationId: string;
          exerciseType: string;
          promptSnapshot: string;
          userAnswer: string;
          selfRating: string;
          hintUsed: number;
          completedAt: string;
        } | undefined;
      if (existing) {
        if (
          existing.collocationId !== input.collocationId
          || existing.exerciseType !== input.exerciseType
          || existing.promptSnapshot !== input.promptSnapshot
          || existing.userAnswer !== input.userAnswer
          || existing.selfRating !== input.selfRating
          || Boolean(existing.hintUsed) !== input.hintUsed
        ) throw new AttemptIdConflictError(`Attempt id reused with different payload: ${attemptId}`);
        duplicate = true;
        storedCompletedAt = existing.completedAt;
        new LearningEvidenceRepository(this.connection).syncAttempt("collocation_attempt", attemptId);
        return;
      }
      const previous = this.connection.sqlite
        .prepare("SELECT COUNT(*) AS count FROM collocation_attempts WHERE collocation_id = ? AND exercise_type = ?")
        .get(input.collocationId, input.exerciseType) as { count: number };
      this.connection.sqlite
        .prepare(
          `INSERT INTO collocation_attempts
           (id, collocation_id, exercise_type, prompt_snapshot, user_answer, normalized_answer,
            match_result, self_rating, hint_used, attempt_count, duration_ms, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, 'self_rated', ?, ?, ?, ?, ?)`,
        )
        .run(
          attemptId,
          input.collocationId,
          input.exerciseType,
          input.promptSnapshot,
          input.userAnswer,
          normalizeCollocationAnswer(input.userAnswer),
          input.selfRating,
          input.hintUsed ? 1 : 0,
          previous.count + 1,
          input.durationMs,
          completedAt,
        );
      this.connection.sqlite
        .prepare(
          `UPDATE collocation_progress SET
             learning_stage = ?, application_score = ?,
             success_streak = CASE WHEN ? THEN 0 ELSE success_streak + ? END,
             lapse_count = lapse_count + ?, interval_days = ?, due_at = ?,
             last_reviewed_at = ?, updated_at = ?
           WHERE collocation_id = ?`,
        )
        .run(
          next.learningStage,
          applicationScore,
          next.resetStreak ? 1 : 0,
          next.successIncrement,
          input.selfRating === "forgot" ? 1 : 0,
          next.intervalDays,
          next.dueAt,
          completedAt,
          completedAt,
          input.collocationId,
        );
      new LearningEvidenceRepository(this.connection).syncAttempt("collocation_attempt", attemptId);
    })();
    if (duplicate) {
      const progress = this.connection.sqlite
        .prepare("SELECT due_at AS dueAt, learning_stage AS learningStage FROM collocation_progress WHERE collocation_id = ?")
        .get(input.collocationId) as { dueAt: string; learningStage: string };
      return { attemptId, completedAt: storedCompletedAt!, dueAt: progress.dueAt, learningStage: progress.learningStage, duplicate: true };
    }
    return { attemptId, completedAt, dueAt: next.dueAt, learningStage: next.learningStage, duplicate: false };
  }

  private recordAttempt(
    input: TranslationRecallAttempt & {
      attemptId?: string;
      exerciseType: "translation_recall" | "slot_replacement" | "guided_application";
    },
    finalizeReview: boolean,
  ) {
    const completedAt = input.completedAt ?? new Date().toISOString();
    const attemptId = input.attemptId ?? randomUUID();
    const next = finalizeReview ? nextReviewState(input.selfRating, new Date(completedAt)) : null;
    let duplicate = false;
    let storedCompletedAt: string | null = null;
    this.connection.sqlite.transaction(() => {
      const card = this.connection.sqlite.prepare("SELECT 1 FROM cards WHERE id = ?").get(input.cardId);
      if (!card) throw new Error(`Unknown card: ${input.cardId}`);
      const existing = this.connection.sqlite
        .prepare(
          `SELECT card_id AS cardId, exercise_type AS exerciseType, prompt_snapshot AS promptSnapshot,
                  user_answer AS userAnswer, self_rating AS selfRating, hint_used AS hintUsed,
                  completed_at AS completedAt
           FROM attempts WHERE id = ?`,
        )
        .get(attemptId) as {
          cardId: string;
          exerciseType: string;
          promptSnapshot: string;
          userAnswer: string;
          selfRating: string;
          hintUsed: number;
          completedAt: string;
        } | undefined;
      if (existing) {
        if (
          existing.cardId !== input.cardId
          || existing.exerciseType !== input.exerciseType
          || existing.promptSnapshot !== input.promptSnapshot
          || existing.userAnswer !== input.userAnswer
          || existing.selfRating !== input.selfRating
          || Boolean(existing.hintUsed) !== input.hintUsed
        ) throw new AttemptIdConflictError(`Attempt id reused with different payload: ${attemptId}`);
        duplicate = true;
        storedCompletedAt = existing.completedAt;
        new LearningEvidenceRepository(this.connection).syncAttempt("sentence_attempt", attemptId);
        return;
      }
      const previous = this.connection.sqlite
        .prepare("SELECT COUNT(*) AS count FROM attempts WHERE card_id = ? AND exercise_type = ?")
        .get(input.cardId, input.exerciseType) as { count: number };
      this.connection.sqlite
        .prepare(
          `INSERT INTO attempts
           (id, card_id, exercise_type, prompt_snapshot, user_answer, self_rating,
            hint_used, attempt_count, duration_ms, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          attemptId,
          input.cardId,
          input.exerciseType,
          input.promptSnapshot,
          input.userAnswer,
          input.selfRating,
          input.hintUsed ? 1 : 0,
          previous.count + 1,
          input.durationMs,
          completedAt,
        );
      if (next) {
        this.connection.sqlite
          .prepare(
            `UPDATE review_states SET
               learning_stage = ?,
               success_streak = CASE WHEN ? THEN 0 ELSE success_streak + ? END,
               interval_days = ?, due_at = ?, last_reviewed_at = ?, updated_at = ?
             WHERE card_id = ?`,
          )
          .run(
            next.learningStage,
            next.resetStreak ? 1 : 0,
            next.successIncrement,
            next.intervalDays,
            next.dueAt,
            completedAt,
            completedAt,
            input.cardId,
          );
      }
      new LearningEvidenceRepository(this.connection).syncAttempt("sentence_attempt", attemptId);
    })();
    if (duplicate && next) {
      const state = this.connection.sqlite
        .prepare("SELECT due_at AS dueAt, learning_stage AS learningStage FROM review_states WHERE card_id = ?")
        .get(input.cardId) as { dueAt: string; learningStage: string };
      return { attemptId, completedAt: storedCompletedAt!, dueAt: state.dueAt, learningStage: state.learningStage, duplicate: true };
    }
    if (duplicate) return { attemptId, completedAt: storedCompletedAt!, duplicate: true };
    return next
      ? { attemptId, completedAt, dueAt: next.dueAt, learningStage: next.learningStage, duplicate: false }
      : { attemptId, completedAt, duplicate: false };
  }
}
