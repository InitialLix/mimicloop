import { createHash, randomUUID } from "node:crypto";
import {
  ADAPTIVE_POLICY_VERSION,
  type AdaptiveActionV1,
  type AdaptiveDecisionV1,
  type AdaptiveRetestV1,
} from "../domain/learner-model/adaptive-policy";
import type { AssetType } from "../domain/learner-model/learning-evidence";
import type { SqliteConnection } from "./client";

export type AdaptiveTriggerKind = "sentence_attempt" | "collocation_attempt";

export type StoredAdaptiveDecision = AdaptiveDecisionV1 & {
  id: string;
  learnerId: string;
  triggerKind: AdaptiveTriggerKind;
  triggerId: string;
  assetId: string;
  assetType: AssetType;
  traceId: string;
  createdAt: string;
};

export type StoredAdaptiveRetest = AdaptiveRetestV1 & {
  id: string;
  learnerId: string;
  assetId: string;
  assetType: AssetType;
  sourceDecisionId: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

function stableId(...parts: string[]) {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex");
}

function parseArray<T>(value: string) {
  return JSON.parse(value) as T[];
}

export class AdaptiveTrainingRepository {
  constructor(private readonly connection: SqliteConnection) {}

  getByTrigger(triggerKind: AdaptiveTriggerKind, triggerId: string): StoredAdaptiveDecision | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, trigger_kind AS triggerKind, trigger_id AS triggerId,
              asset_id AS assetId, asset_type AS assetType, policy_version AS policyVersion,
              action_json AS actionJson, reason_codes_json AS reasonCodesJson,
              input_evidence_ids_json AS inputEvidenceIdsJson,
              candidate_actions_json AS candidateActionsJson, guard_results_json AS guardResultsJson,
              trace_id AS traceId, created_at AS createdAt
       FROM adaptive_training_decisions WHERE trigger_kind = ? AND trigger_id = ?`,
    ).get(triggerKind, triggerId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      learnerId: String(row.learnerId),
      triggerKind: row.triggerKind as AdaptiveTriggerKind,
      triggerId: String(row.triggerId),
      assetId: String(row.assetId),
      assetType: row.assetType as AssetType,
      policyVersion: ADAPTIVE_POLICY_VERSION,
      action: JSON.parse(String(row.actionJson)) as AdaptiveActionV1,
      reasonCodes: parseArray<string>(String(row.reasonCodesJson)),
      inputEvidenceIds: parseArray<string>(String(row.inputEvidenceIdsJson)),
      candidateActions: parseArray<AdaptiveDecisionV1["candidateActions"][number]>(String(row.candidateActionsJson)),
      guardResults: parseArray<string>(String(row.guardResultsJson)),
      retest: this.getRetestByDecision(String(row.id)),
      traceId: String(row.traceId),
      createdAt: String(row.createdAt),
    };
  }

  getRetestByDecision(sourceDecisionId: string): StoredAdaptiveRetest | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, asset_id AS assetId, asset_type AS assetType,
              source_decision_id AS sourceDecisionId, purpose, due_at AS dueAt, status,
              created_at AS createdAt, updated_at AS updatedAt
       FROM adaptive_retests WHERE source_decision_id = ?`,
    ).get(sourceDecisionId) as StoredAdaptiveRetest | undefined;
    return row ?? null;
  }

  record(input: {
    learnerId: string;
    triggerKind: AdaptiveTriggerKind;
    triggerId: string;
    assetId: string;
    assetType: AssetType;
    decision: AdaptiveDecisionV1;
    createdAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getByTrigger(input.triggerKind, input.triggerId);
      if (existing) return { created: false as const, decision: existing };

      const id = stableId(input.decision.policyVersion, input.triggerKind, input.triggerId);
      const traceId = randomUUID();
      const learnerIdHash = stableId("learner", input.learnerId);
      const step = {
        name: "select_next_training_action",
        kind: "policy",
        startedAt: input.createdAt,
        durationMs: 0,
        outcome: input.decision.action.type,
        inputRefs: input.decision.inputEvidenceIds,
        outputRefs: [id],
        errorCodes: [],
      };
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'adaptive_training', 'success', ?, ?, ?, NULL, NULL, ?,
                 'adaptive-decision.v1', NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId,
        learnerIdHash,
        input.createdAt,
        input.createdAt,
        JSON.stringify([step]),
        input.decision.policyVersion,
        input.createdAt,
        input.createdAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO adaptive_training_decisions
         (id, learner_id, trigger_kind, trigger_id, asset_id, asset_type, policy_version,
          action_json, reason_codes_json, input_evidence_ids_json, candidate_actions_json,
          guard_results_json, trace_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        input.learnerId,
        input.triggerKind,
        input.triggerId,
        input.assetId,
        input.assetType,
        input.decision.policyVersion,
        JSON.stringify(input.decision.action),
        JSON.stringify(input.decision.reasonCodes),
        JSON.stringify(input.decision.inputEvidenceIds),
        JSON.stringify(input.decision.candidateActions),
        JSON.stringify(input.decision.guardResults),
        traceId,
        input.createdAt,
      );
      if (input.decision.retest) {
        const retestId = stableId("adaptive-retest.v1", id, input.decision.retest.purpose);
        this.connection.sqlite.prepare(
          `INSERT INTO adaptive_retests
           (id, learner_id, asset_id, asset_type, source_decision_id, purpose, due_at,
            status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        ).run(
          retestId,
          input.learnerId,
          input.assetId,
          input.assetType,
          id,
          input.decision.retest.purpose,
          input.decision.retest.dueAt,
          input.createdAt,
          input.createdAt,
        );
      }
      return { created: true as const, decision: this.getByTrigger(input.triggerKind, input.triggerId)! };
    })();
  }
}
