import type {
  AssetLearnerStateV1,
  EvidenceOutcome,
  LearningEvidenceContextV1,
} from "../domain/learner-model/learning-evidence";

export type LearnerStage = "unverified" | "recall" | "assisted_use" | "independent_use" | "retained";

export interface LearnerSummaryEvidence {
  dimension: "recall" | "guided_use" | "transfer_use" | "spontaneous_use" | "delayed_retention";
  outcome: EvidenceOutcome;
  independent: boolean;
  occurredAt: string;
  context: LearningEvidenceContextV1;
}

export interface LearnerAssetSummary {
  stage: LearnerStage;
  label: string;
  reason: string;
  upgradeCondition: string;
}

function latest(items: LearnerSummaryEvidence[]) {
  return [...items].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];
}

export function summarizeLearnerAsset(
  state: AssetLearnerStateV1,
  evidence: LearnerSummaryEvidence[],
): LearnerAssetSummary {
  const judged = evidence.filter((item) => item.outcome !== "not_judged");
  const useEvidence = judged.filter((item) => item.dimension === "guided_use" || item.dimension === "transfer_use");
  const latestUse = latest(useEvidence);
  const latestRecall = latest(judged.filter((item) => item.dimension === "recall"));
  const independentUseSuccess = useEvidence.some((item) => item.outcome === "success" && item.independent);

  if (state.delayedRetention === "stable" || state.delayedRetention === "developing") {
    return {
      stage: "retained",
      label: "跨日验证通过",
      reason: "间隔三天后再次独立完成。",
      upgradeCondition: "按正常复习节奏继续。",
    };
  }

  if (state.transferUse === "stable") {
    return {
      stage: "independent_use",
      label: "独立 Use 稳定",
      reason: "不同日期已有多次独立 Use 成功。",
      upgradeCondition: "等待跨日复测。",
    };
  }

  if (independentUseSuccess || state.transferUse === "developing") {
    return {
      stage: independentUseSuccess ? "independent_use" : "assisted_use",
      label: independentUseSuccess ? "独立 Use 通过" : "提示后完成",
      reason: independentUseSuccess
        ? "已有一次无提示 Use 成功。"
        : "Use 已通过；使用了提示或参考答案。",
      upgradeCondition: independentUseSuccess
        ? "换一天再次无提示完成 Use。"
        : "无提示完成一次 Use。",
    };
  }

  if (latestUse?.outcome === "partial" && latestUse.context.evaluatorVerdict === "pass") {
    return {
      stage: "assisted_use",
      label: "提示后完成",
      reason: "最近一次 Use：通过；使用了提示或参考答案。",
      upgradeCondition: "无提示完成一次 Use。",
    };
  }

  if (latestUse) {
    return {
      stage: "assisted_use",
      label: latestUse.outcome === "failure" ? "Use 未通过" : "Use 未稳定",
      reason: latestUse.outcome === "failure"
        ? "最近一次 Use 没有成功记录。"
        : "Use 已记录；尚无独立成功。",
      upgradeCondition: "完成一次可判断的 Use。",
    };
  }

  if (state.recall === "stable" || state.recall === "developing") {
    return {
      stage: "recall",
      label: "Recall 通过",
      reason: "Recall 已成功；Use 尚未验证。",
      upgradeCondition: "完成一次 Use。",
    };
  }

  if (latestRecall) {
    return {
      stage: "recall",
      label: "Recall 未稳定",
      reason: "Recall 已记录；尚无无提示成功。",
      upgradeCondition: "无提示完成一次 Recall。",
    };
  }

  return {
    stage: "unverified",
    label: "未验证",
    reason: "暂无正式作答记录。",
    upgradeCondition: "完成一次 Recall。",
  };
}
