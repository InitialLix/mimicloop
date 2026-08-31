import { createHash } from "node:crypto";
import {
  DELAYED_RETENTION_MS,
  LEARNING_EVIDENCE_VERSION,
  type AssetLearnerStateV1,
  type AssetType,
  type EvidenceDimension,
  type EvidenceOutcome,
  type LearningEvidenceEvaluatorV1,
  type LearningEvidenceV1,
  isIndependentEvidence,
} from "../domain/learner-model/learning-evidence";
import { reduceLearnerState } from "../domain/learner-model/learner-state-reducer";
import type { UseEvaluationV1 } from "../domain/practice/use-evaluation";
import type { SqliteConnection } from "./client";

export const LOCAL_LEARNER_ID = "local-default";
export const MIN_EVIDENCE_CONFIDENCE = 0.75;

type SourceKind = "sentence_attempt" | "collocation_attempt";

type AttemptRow = {
  id: string;
  assetId: string;
  exerciseType: string;
  selfRating: string;
  hintUsed: number;
  matchResult?: string;
  primaryFocus?: string;
  rawJson: string;
  completedAt: string;
  runStatus: string | null;
  evaluationJson: string | null;
  retryIndex: number | null;
  traceId: string | null;
  promptVersion: string | null;
  schemaVersion: string | null;
  model: string | null;
};

function stableEvidenceId(sourceKind: SourceKind, sourceId: string, dimension: EvidenceDimension) {
  return createHash("sha256").update(`${LEARNING_EVIDENCE_VERSION}:${sourceKind}:${sourceId}:${dimension}`).digest("hex");
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function assetType(row: AttemptRow, sourceKind: SourceKind): AssetType {
  if (sourceKind === "collocation_attempt") return "collocation";
  return row.primaryFocus === "vocabulary" ? "fixed_phrase" : "sentence_pattern";
}

function useDimension(row: AttemptRow, sourceKind: SourceKind): EvidenceDimension {
  if (sourceKind === "sentence_attempt") {
    return row.exerciseType === "slot_replacement" ? "transfer_use" : "guided_use";
  }
  const content = parseJson<{ exercise_seed?: { guided_application?: { transfer_type?: string } } }>(row.rawJson);
  return content?.exercise_seed?.guided_application?.transfer_type === "cross_topic"
    ? "transfer_use"
    : "guided_use";
}

function deterministicEvaluator(): LearningEvidenceEvaluatorV1 {
  return {
    schemaVersion: "deterministic-attempt.v1",
    promptVersion: "none",
    model: "deterministic",
    confidence: 1,
    traceId: "",
  };
}

function evaluatorFor(row: AttemptRow, evaluation: UseEvaluationV1 | null): LearningEvidenceEvaluatorV1 {
  if (!evaluation) return deterministicEvaluator();
  return {
    schemaVersion: row.schemaVersion ?? evaluation.schema_version,
    promptVersion: row.promptVersion ?? "unknown",
    model: row.model ?? "unknown",
    confidence: evaluation.confidence,
    traceId: row.traceId ?? "",
  };
}

function recallOutcome(row: AttemptRow): EvidenceOutcome {
  if (row.selfRating === "forgot") return "failure";
  if (row.selfRating === "fuzzy") return "partial";
  if (row.matchResult === "unmatched") return "partial";
  return row.hintUsed ? "partial" : "success";
}

function useOutcome(row: AttemptRow, evaluation: UseEvaluationV1 | null): EvidenceOutcome {
  if (!evaluation || row.runStatus !== "success") {
    if (row.selfRating === "forgot") return "failure";
    return "partial";
  }
  if (evaluation.verdict === "cannot_judge" || evaluation.needs_review || evaluation.confidence < MIN_EVIDENCE_CONFIDENCE) {
    return "not_judged";
  }
  if (evaluation.verdict === "pass") return row.hintUsed ? "partial" : "success";
  return evaluation.verdict === "incomplete" || row.selfRating === "forgot" ? "failure" : "partial";
}

function rowToEvidence(row: AttemptRow, sourceKind: SourceKind): LearningEvidenceV1 {
  const recall = row.exerciseType === "translation_recall";
  const evaluation = recall ? null : parseJson<UseEvaluationV1>(row.evaluationJson);
  const dimension = recall ? "recall" : useDimension(row, sourceKind);
  return {
    id: stableEvidenceId(sourceKind, row.id, dimension),
    learnerId: LOCAL_LEARNER_ID,
    assetId: row.assetId,
    assetType: assetType(row, sourceKind),
    dimension,
    outcome: recall ? recallOutcome(row) : useOutcome(row, evaluation),
    context: {
      attemptId: row.id,
      hintLevel: row.hintUsed ? 1 : 0,
      retryIndex: row.retryIndex ?? 0,
      referenceShown: Boolean(row.hintUsed),
      origin: row.hintUsed ? "user_after_hint" : "user_independent",
      evaluatorVerdict: evaluation?.verdict ?? (recall ? undefined : "legacy_self_rating"),
    },
    evaluator: recall ? deterministicEvaluator() : evaluatorFor(row, evaluation),
    occurredAt: row.completedAt,
    evidenceVersion: LEARNING_EVIDENCE_VERSION,
  };
}

function storedEvidence(row: Record<string, unknown>): LearningEvidenceV1 {
  return {
    id: String(row.id),
    learnerId: String(row.learnerId),
    assetId: String(row.assetId),
    assetType: row.assetType as AssetType,
    dimension: row.dimension as EvidenceDimension,
    outcome: row.outcome as EvidenceOutcome,
    context: JSON.parse(String(row.contextJson)) as LearningEvidenceV1["context"],
    evaluator: JSON.parse(String(row.evaluatorJson)) as LearningEvidenceV1["evaluator"],
    occurredAt: String(row.occurredAt),
    evidenceVersion: LEARNING_EVIDENCE_VERSION,
  };
}

export class LearningEvidenceRepository {
  constructor(private readonly connection: SqliteConnection) {}

  recordLearningEvidence(evidence: LearningEvidenceV1, sourceKind: SourceKind, sourceId: string) {
    const existing = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, asset_id AS assetId, asset_type AS assetType,
              dimension, outcome, context_json AS contextJson, evaluator_json AS evaluatorJson,
              occurred_at AS occurredAt
       FROM learning_evidence WHERE source_kind = ? AND source_id = ? AND dimension = ?`,
    ).get(sourceKind, sourceId, evidence.dimension) as Record<string, unknown> | undefined;
    if (existing) {
      const current = storedEvidence(existing);
      if (JSON.stringify(current) !== JSON.stringify(evidence)) {
        throw new Error(`Learning evidence conflict for ${sourceKind}:${sourceId}:${evidence.dimension}`);
      }
      return { created: false, evidence: current };
    }
    this.connection.sqlite.prepare(
      `INSERT INTO learning_evidence
       (id, learner_id, asset_id, asset_type, dimension, outcome, context_json, evaluator_json,
        source_kind, source_id, evidence_version, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      evidence.id,
      evidence.learnerId,
      evidence.assetId,
      evidence.assetType,
      evidence.dimension,
      evidence.outcome,
      JSON.stringify(evidence.context),
      JSON.stringify(evidence.evaluator),
      sourceKind,
      sourceId,
      evidence.evidenceVersion,
      evidence.occurredAt,
      evidence.occurredAt,
    );
    return { created: true, evidence };
  }

  syncAttempt(sourceKind: SourceKind, attemptId: string) {
    const row = this.getAttemptRow(sourceKind, attemptId);
    if (!row) throw new Error(`Unknown ${sourceKind}: ${attemptId}`);
    const observed = rowToEvidence(row, sourceKind);
    const observedResult = this.recordLearningEvidence(observed, sourceKind, row.id);
    const delayed = this.buildDelayedEvidence(observed, sourceKind);
    const delayedResult = delayed
      ? this.recordLearningEvidence(delayed, sourceKind, row.id)
      : null;
    return { observed: observedResult, delayed: delayedResult };
  }

  syncAllAttempts() {
    const startedAt = this.evidenceStartedAt();
    const sentenceIds = this.connection.sqlite.prepare(
      `SELECT id FROM attempts ${startedAt ? "WHERE completed_at >= ?" : ""} ORDER BY completed_at, id`,
    ).all(...(startedAt ? [startedAt] : [])) as Array<{ id: string }>;
    const collocationIds = this.connection.sqlite.prepare(
      `SELECT id FROM collocation_attempts ${startedAt ? "WHERE completed_at >= ?" : ""} ORDER BY completed_at, id`,
    ).all(...(startedAt ? [startedAt] : [])) as Array<{ id: string }>;
    let created = 0;
    for (const item of sentenceIds) {
      const result = this.syncAttempt("sentence_attempt", item.id);
      created += Number(result.observed.created) + Number(result.delayed?.created ?? false);
    }
    for (const item of collocationIds) {
      const result = this.syncAttempt("collocation_attempt", item.id);
      created += Number(result.observed.created) + Number(result.delayed?.created ?? false);
    }
    return { created, total: this.count() };
  }

  listEvidence(learnerId = LOCAL_LEARNER_ID) {
    const startedAt = this.evidenceStartedAt();
    const rows = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, asset_id AS assetId, asset_type AS assetType,
              dimension, outcome, context_json AS contextJson, evaluator_json AS evaluatorJson,
              occurred_at AS occurredAt
       FROM learning_evidence WHERE learner_id = ? ${startedAt ? "AND occurred_at >= ?" : ""}
       ORDER BY occurred_at, id`,
    ).all(learnerId, ...(startedAt ? [startedAt] : [])) as Array<Record<string, unknown>>;
    return rows.map(storedEvidence);
  }

  getLearnerStates(learnerId = LOCAL_LEARNER_ID): AssetLearnerStateV1[] {
    const groups = new Map<string, LearningEvidenceV1[]>();
    for (const item of this.listEvidence(learnerId)) {
      const group = groups.get(item.assetId) ?? [];
      group.push(item);
      groups.set(item.assetId, group);
    }
    return Array.from(groups.values())
      .map(reduceLearnerState)
      .filter((item): item is AssetLearnerStateV1 => item !== null)
      .sort((left, right) => (right.lastAttemptAt ?? "").localeCompare(left.lastAttemptAt ?? ""));
  }

  count() {
    const startedAt = this.evidenceStartedAt();
    return (this.connection.sqlite.prepare(
      `SELECT COUNT(*) AS count FROM learning_evidence ${startedAt ? "WHERE occurred_at >= ?" : ""}`,
    ).get(...(startedAt ? [startedAt] : [])) as { count: number }).count;
  }

  discardEvidenceBefore(startedAt: string, updatedAt = new Date().toISOString()) {
    if (!Number.isFinite(Date.parse(startedAt))) throw new Error(`Invalid learner evidence cutoff: ${startedAt}`);
    return this.connection.sqlite.transaction(() => {
      this.connection.sqlite.prepare(
        `INSERT INTO settings (key, value_json, updated_at) VALUES ('learner_model_evidence_started_at', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      ).run(JSON.stringify(startedAt), updatedAt);
      const deleted = this.connection.sqlite.prepare("DELETE FROM learning_evidence WHERE occurred_at < ?").run(startedAt).changes;
      return { startedAt, deleted, remaining: this.count() };
    })();
  }

  private buildDelayedEvidence(observed: LearningEvidenceV1, sourceKind: SourceKind): LearningEvidenceV1 | null {
    if (observed.dimension === "delayed_retention" || observed.outcome === "not_judged" || !isIndependentEvidence(observed)) return null;
    const previous = this.connection.sqlite.prepare(
      `SELECT occurred_at AS occurredAt
       FROM learning_evidence
       WHERE learner_id = ? AND asset_id = ? AND dimension <> 'delayed_retention'
         AND outcome <> 'not_judged' AND source_id <> ? AND occurred_at < ?
       ORDER BY occurred_at DESC LIMIT 1`,
    ).get(observed.learnerId, observed.assetId, observed.context.attemptId, observed.occurredAt) as { occurredAt: string } | undefined;
    if (!previous || Date.parse(observed.occurredAt) - Date.parse(previous.occurredAt) < DELAYED_RETENTION_MS) return null;
    return {
      ...observed,
      id: stableEvidenceId(sourceKind, observed.context.attemptId, "delayed_retention"),
      dimension: "delayed_retention",
      context: { ...observed.context, sourceDimension: observed.dimension },
    };
  }

  private getAttemptRow(sourceKind: SourceKind, attemptId: string): AttemptRow | null {
    const sentence = sourceKind === "sentence_attempt";
    const sql = sentence
      ? `SELECT a.id, a.card_id AS assetId, a.exercise_type AS exerciseType,
                a.self_rating AS selfRating, CAST(a.hint_used AS INTEGER) AS hintUsed,
                c.primary_focus AS primaryFocus, c.raw_json AS rawJson, a.completed_at AS completedAt,
                u.status AS runStatus, u.evaluation_json AS evaluationJson, u.retry_index AS retryIndex,
                u.trace_id AS traceId, t.prompt_version AS promptVersion,
                t.schema_version AS schemaVersion, t.model
         FROM attempts a JOIN cards c ON c.id = a.card_id
         LEFT JOIN use_evaluation_runs u ON u.attempt_id = a.id
         LEFT JOIN agent_traces t ON t.id = u.trace_id
         WHERE a.id = ?`
      : `SELECT a.id, a.collocation_id AS assetId, a.exercise_type AS exerciseType,
                a.self_rating AS selfRating, CAST(a.hint_used AS INTEGER) AS hintUsed,
                a.match_result AS matchResult, c.raw_json AS rawJson, a.completed_at AS completedAt,
                u.status AS runStatus, u.evaluation_json AS evaluationJson, u.retry_index AS retryIndex,
                u.trace_id AS traceId, t.prompt_version AS promptVersion,
                t.schema_version AS schemaVersion, t.model
         FROM collocation_attempts a JOIN collocations c ON c.id = a.collocation_id
         LEFT JOIN use_evaluation_runs u ON u.attempt_id = a.id
         LEFT JOIN agent_traces t ON t.id = u.trace_id
         WHERE a.id = ?`;
    return (this.connection.sqlite.prepare(sql).get(attemptId) as AttemptRow | undefined) ?? null;
  }

  private evidenceStartedAt() {
    const row = this.connection.sqlite.prepare(
      "SELECT value_json AS valueJson FROM settings WHERE key = 'learner_model_evidence_started_at'",
    ).get() as { valueJson: string } | undefined;
    if (!row) return null;
    const value = JSON.parse(row.valueJson) as unknown;
    return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
  }
}
