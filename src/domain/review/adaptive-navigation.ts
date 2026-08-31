import type { AdaptiveActionV1, AdaptiveRetestV1 } from "../learner-model/adaptive-policy";

export type AdaptiveNextStepPayload = {
  action: AdaptiveActionV1;
  retest: AdaptiveRetestV1 | null;
};

export function adaptiveRetestLabel(retest: AdaptiveRetestV1) {
  if (retest.purpose === "quick_confirmation") return "快速确认";
  if (retest.purpose === "lower_scaffold") return "提示复测";
  return "保持复测";
}

export function adaptiveCompletionNavigation({
  step,
  nextHref,
  nextLabel,
  sourceHref,
  retryHref,
}: {
  step: AdaptiveNextStepPayload | null | undefined;
  nextHref: string;
  nextLabel: string;
  sourceHref: string;
  retryHref: string;
}) {
  if (!step || step.action.type === "ADVANCE") {
    return { href: nextHref, label: nextLabel, differsFromPlan: false, retest: step?.retest ?? null };
  }
  if (step.action.type === "RETURN_TO_SOURCE") {
    return { href: sourceHref, label: "回看学习内容", differsFromPlan: true, retest: step.retest };
  }
  if (step.action.type === "GUIDED_USE") {
    return { href: retryHref, label: "再做提示运用", differsFromPlan: true, retest: step.retest };
  }
  if (step.action.type === "CROSS_TOPIC_USE") {
    return { href: retryHref, label: "换场景再用一次", differsFromPlan: true, retest: step.retest };
  }
  if (step.action.type === "RETRY_WITH_HINT") {
    return { href: retryHref, label: "按提示再试一次", differsFromPlan: true, retest: step.retest };
  }
  return { href: retryHref, label: "开始复测", differsFromPlan: true, retest: step.retest };
}
