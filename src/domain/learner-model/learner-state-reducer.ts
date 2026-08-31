import {
  LEARNER_STATE_REDUCER_VERSION,
  type AbilityState,
  type AssetLearnerStateV1,
  type EvidenceDimension,
  type LearningEvidenceV1,
  isIndependentEvidence,
} from "./learning-evidence";

function shanghaiDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function reduceDimension(evidence: LearningEvidenceV1[]): AbilityState {
  const judged = evidence
    .filter((item) => item.outcome !== "not_judged")
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  if (!judged.length) return "unknown";

  const independentSuccesses = judged.filter(
    (item) => item.outcome === "success" && isIndependentEvidence(item),
  );
  const assistedPasses = judged.filter(
    (item) => item.outcome === "partial" && item.context.evaluatorVerdict === "pass",
  );
  const failures = judged.filter((item) => item.outcome === "failure");
  const distinctSuccessDays = new Set(independentSuccesses.map((item) => shanghaiDay(item.occurredAt))).size;
  const latestIndependentSuccess = independentSuccesses.at(-1)?.occurredAt ?? null;
  const failuresAfterLatestSuccess = latestIndependentSuccess
    ? judged.filter((item) => item.outcome === "failure" && item.occurredAt > latestIndependentSuccess).length
    : failures.length;

  const hasStableEvidence = independentSuccesses.length >= 2
    && distinctSuccessDays >= 2
    && independentSuccesses.length > failures.length;
  if (hasStableEvidence && failuresAfterLatestSuccess < 2) return "stable";

  const hasDevelopingIndependentEvidence = independentSuccesses.length >= 1
    && independentSuccesses.length >= failures.length;
  const hasDevelopingAssistedEvidence = assistedPasses.length >= 2 && failures.length === 0;
  if (hasDevelopingIndependentEvidence || hasDevelopingAssistedEvidence || hasStableEvidence) return "developing";
  return "weak";
}

function forDimension(evidence: LearningEvidenceV1[], dimension: EvidenceDimension) {
  return evidence.filter((item) => item.dimension === dimension);
}

export function reduceLearnerState(evidence: LearningEvidenceV1[]): AssetLearnerStateV1 | null {
  if (!evidence.length) return null;
  const ordered = [...evidence].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const first = ordered[0];
  const counts: Record<string, number> = {};
  for (const item of ordered) {
    const dimensionKey = item.dimension;
    const outcomeKey = `${item.dimension}.${item.outcome}`;
    counts[dimensionKey] = (counts[dimensionKey] ?? 0) + 1;
    counts[outcomeKey] = (counts[outcomeKey] ?? 0) + 1;
  }

  const transferEvidence = forDimension(ordered, "transfer_use");
  const guidedEvidence = [...forDimension(ordered, "guided_use"), ...transferEvidence];
  return {
    learnerId: first.learnerId,
    assetId: first.assetId,
    assetType: first.assetType,
    recall: reduceDimension(forDimension(ordered, "recall")),
    guidedUse: reduceDimension(guidedEvidence),
    transferUse: reduceDimension(transferEvidence),
    spontaneousUse: reduceDimension(forDimension(ordered, "spontaneous_use")),
    delayedRetention: reduceDimension(forDimension(ordered, "delayed_retention")),
    evidenceCounts: counts,
    lastAttemptAt: ordered.at(-1)?.occurredAt ?? null,
    nextReviewAt: null,
    reducerVersion: LEARNER_STATE_REDUCER_VERSION,
  };
}
