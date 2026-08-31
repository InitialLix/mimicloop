export const LEARNING_EVIDENCE_VERSION = "learning-evidence.v1" as const;
export const LEARNER_STATE_REDUCER_VERSION = "learner-state-reducer.v1" as const;
export const DELAYED_RETENTION_MS = 72 * 60 * 60 * 1000;

export type AssetType = "collocation" | "sentence_pattern" | "fixed_phrase";
export type EvidenceDimension = "recall" | "guided_use" | "transfer_use" | "spontaneous_use" | "delayed_retention";
export type EvidenceOutcome = "success" | "partial" | "failure" | "not_judged";
export type EvidenceOrigin =
  | "user_independent"
  | "user_after_question"
  | "user_after_hint"
  | "user_selected"
  | "agent_supplied";

export interface LearningEvidenceContextV1 {
  exerciseId?: string;
  attemptId: string;
  topic?: string;
  sourceTopic?: string;
  hintLevel: number;
  retryIndex: number;
  referenceShown: boolean;
  origin: EvidenceOrigin;
  evaluatorVerdict?: "pass" | "retry" | "incomplete" | "cannot_judge" | "legacy_self_rating";
  sourceDimension?: Exclude<EvidenceDimension, "delayed_retention">;
}

export interface LearningEvidenceEvaluatorV1 {
  schemaVersion: string;
  promptVersion: string;
  model: string;
  confidence: number | null;
  traceId: string;
}

export interface LearningEvidenceV1 {
  id: string;
  learnerId: string;
  assetId: string;
  assetType: AssetType;
  dimension: EvidenceDimension;
  outcome: EvidenceOutcome;
  context: LearningEvidenceContextV1;
  evaluator: LearningEvidenceEvaluatorV1;
  occurredAt: string;
  evidenceVersion: typeof LEARNING_EVIDENCE_VERSION;
}

export type AbilityState = "unknown" | "weak" | "developing" | "stable";

export interface AssetLearnerStateV1 {
  learnerId: string;
  assetId: string;
  assetType: AssetType;
  recall: AbilityState;
  guidedUse: AbilityState;
  transferUse: AbilityState;
  spontaneousUse: AbilityState;
  delayedRetention: AbilityState;
  evidenceCounts: Record<string, number>;
  lastAttemptAt: string | null;
  nextReviewAt: string | null;
  reducerVersion: typeof LEARNER_STATE_REDUCER_VERSION;
}

export function isIndependentEvidence(evidence: LearningEvidenceV1) {
  return evidence.context.origin === "user_independent"
    && evidence.context.hintLevel === 0
    && !evidence.context.referenceShown;
}
