import {
  DELAYED_RETENTION_MS,
  isIndependentEvidence,
  type AssetLearnerStateV1,
  type LearningEvidenceV1,
} from "./learning-evidence";
import { NO_CORRECTION_PATH, type CorrectionPathV1 } from "./correction-path";

export const ADAPTIVE_POLICY_VERSION = "adaptive-policy.v1" as const;

export type AdaptiveActionType =
  | "ADVANCE"
  | "RETRY_WITH_HINT"
  | "RETURN_TO_SOURCE"
  | "GUIDED_USE"
  | "CROSS_TOPIC_USE"
  | "DELAYED_RETEST";

export type AdaptiveActionV1 =
  | { type: "ADVANCE" }
  | { type: "RETRY_WITH_HINT"; hintLevel: number }
  | { type: "RETURN_TO_SOURCE"; assetId: string }
  | { type: "GUIDED_USE"; assetId: string; exerciseId: string }
  | { type: "CROSS_TOPIC_USE"; assetId: string; exerciseId: string }
  | { type: "DELAYED_RETEST"; assetId: string; dueAt: string };

export type AdaptiveRetestV1 = {
  purpose: "quick_confirmation" | "lower_scaffold" | "retention";
  dueAt: string;
};

export type ApprovedAdaptiveExercises = {
  guidedUse?: { assetId: string; exerciseId: string };
  crossTopicUse?: { assetId: string; exerciseId: string };
};

export type AdaptiveDecisionV1 = {
  policyVersion: typeof ADAPTIVE_POLICY_VERSION;
  action: AdaptiveActionV1;
  reasonCodes: string[];
  inputEvidenceIds: string[];
  candidateActions: AdaptiveActionType[];
  guardResults: string[];
  retest: AdaptiveRetestV1 | null;
};

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

function nextShanghaiDayStart(completedAt: Date) {
  const shanghai = new Date(completedAt.getTime() + SHANGHAI_OFFSET_MS);
  return new Date(Date.UTC(
    shanghai.getUTCFullYear(),
    shanghai.getUTCMonth(),
    shanghai.getUTCDate() + 1,
  ) - SHANGHAI_OFFSET_MS);
}

function latestUseEvidence(evidence: LearningEvidenceV1[]) {
  return evidence
    .filter((item) => item.dimension === "guided_use" || item.dimension === "transfer_use")
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0] ?? null;
}

function decision(
  action: AdaptiveActionV1,
  reasonCodes: string[],
  evidence: LearningEvidenceV1[],
  candidateActions: AdaptiveActionType[],
  guardResults: string[],
  retest: AdaptiveRetestV1 | null = null,
): AdaptiveDecisionV1 {
  return {
    policyVersion: ADAPTIVE_POLICY_VERSION,
    action,
    reasonCodes,
    inputEvidenceIds: evidence.map((item) => item.id),
    candidateActions,
    guardResults,
    retest,
  };
}

export function selectNextTrainingAction({
  assetId,
  learnerState,
  evidence,
  exercises,
  completedAt,
  correctionPath = NO_CORRECTION_PATH,
}: {
  assetId: string;
  learnerState: AssetLearnerStateV1;
  evidence: LearningEvidenceV1[];
  exercises: ApprovedAdaptiveExercises;
  completedAt: string;
  correctionPath?: CorrectionPathV1;
}): AdaptiveDecisionV1 {
  const latest = latestUseEvidence(evidence);
  if (!latest) {
    return decision(
      { type: "ADVANCE" },
      ["NO_FORMAL_USE_EVIDENCE"],
      [],
      ["ADVANCE"],
      ["latest_use_evidence_missing", "fallback_navigation_preserved"],
    );
  }

  if (latest.outcome === "not_judged") {
    return decision(
      { type: "ADVANCE" },
      ["EVALUATION_NOT_JUDGED"],
      evidence,
      ["ADVANCE"],
      ["evaluation_not_judged", "fallback_navigation_preserved"],
    );
  }

  if (latest.context.evaluatorVerdict === "legacy_self_rating") {
    return decision(
      { type: "ADVANCE" },
      ["EVALUATION_UNAVAILABLE"],
      evidence,
      ["ADVANCE"],
      ["validated_evaluation_missing", "fallback_navigation_preserved"],
    );
  }

  if (latest.outcome === "failure") {
    const guided = exercises.guidedUse;
    if (latest.dimension === "transfer_use" && learnerState.recall === "stable" && guided) {
      return decision(
        { type: "GUIDED_USE", assetId: guided.assetId, exerciseId: guided.exerciseId },
        ["TRANSFER_FAILED", "RECALL_STABLE", "GUIDED_EXERCISE_AVAILABLE"],
        evidence,
        ["GUIDED_USE", "RETURN_TO_SOURCE"],
        ["guided_exercise_available", "phase2_2_retry_complete"],
      );
    }
    return decision(
      { type: "RETURN_TO_SOURCE", assetId },
      [latest.dimension === "transfer_use" ? "TRANSFER_FAILED" : "GUIDED_USE_FAILED"],
      evidence,
      ["GUIDED_USE", "RETURN_TO_SOURCE"],
      [guided ? "guided_exercise_not_applicable" : "guided_exercise_missing", "phase2_2_retry_complete"],
    );
  }

  if (latest.outcome === "partial") {
    if (latest.context.evaluatorVerdict === "pass") {
      if (correctionPath.kind === "typo_only") {
        return decision(
          { type: "ADVANCE" },
          ["TYPO_ONLY_CORRECTION", "RETENTION_RETEST_REQUIRED"],
          evidence,
          ["ADVANCE", "DELAYED_RETEST"],
          ["pass_confirmed", "typo_only", "independence_guard_passed", "retest_schedule_available"],
          { purpose: "retention", dueAt: new Date(Date.parse(completedAt) + DELAYED_RETENTION_MS).toISOString() },
        );
      }
      if (correctionPath.kind === "minor_surface") {
        return decision(
          { type: "ADVANCE" },
          ["LOCAL_CORRECTION_PASS", "QUICK_CONFIRMATION_REQUIRED"],
          evidence,
          ["ADVANCE", "DELAYED_RETEST"],
          ["pass_confirmed", "single_local_correction", "retest_schedule_available"],
          { purpose: "quick_confirmation", dueAt: nextShanghaiDayStart(new Date(completedAt)).toISOString() },
        );
      }
      return decision(
        { type: "ADVANCE" },
        ["ASSISTED_PASS", "LOWER_SCAFFOLD_RETEST_REQUIRED"],
        evidence,
        ["ADVANCE", "DELAYED_RETEST"],
        ["pass_confirmed", "independence_guard_failed", "retest_schedule_available"],
        { purpose: "lower_scaffold", dueAt: nextShanghaiDayStart(new Date(completedAt)).toISOString() },
      );
    }
    return decision(
      { type: "RETURN_TO_SOURCE", assetId },
      ["USE_NOT_YET_SUCCESSFUL"],
      evidence,
      ["RETURN_TO_SOURCE"],
      ["pass_not_confirmed", "phase2_2_retry_complete"],
    );
  }

  if (latest.outcome === "success" && isIndependentEvidence(latest)) {
    const crossTopic = exercises.crossTopicUse;
    if (latest.dimension === "guided_use" && learnerState.transferUse === "unknown" && crossTopic) {
      return decision(
        { type: "CROSS_TOPIC_USE", assetId: crossTopic.assetId, exerciseId: crossTopic.exerciseId },
        ["GUIDED_USE_SUCCESS", "TRANSFER_EVIDENCE_MISSING", "CROSS_TOPIC_EXERCISE_AVAILABLE"],
        evidence,
        ["CROSS_TOPIC_USE", "ADVANCE", "DELAYED_RETEST"],
        ["cross_topic_exercise_available", "independence_guard_passed"],
      );
    }
    return decision(
      { type: "ADVANCE" },
      [latest.dimension === "transfer_use" ? "TRANSFER_SUCCESS" : "GUIDED_USE_SUCCESS"],
      evidence,
      ["CROSS_TOPIC_USE", "ADVANCE", "DELAYED_RETEST"],
      [crossTopic ? "cross_topic_exercise_not_needed" : "cross_topic_exercise_missing", "independence_guard_passed", "retest_schedule_available"],
      { purpose: "retention", dueAt: new Date(Date.parse(completedAt) + DELAYED_RETENTION_MS).toISOString() },
    );
  }

  return decision(
    { type: "ADVANCE" },
    ["NO_STRONG_ADAPTIVE_SIGNAL"],
    evidence,
    ["ADVANCE"],
    ["conservative_default"],
  );
}
