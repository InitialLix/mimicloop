import type {
  CandidateData,
  CandidateReviewAction,
  CandidateReviewFields,
} from "../../lib/content-types";

export interface CandidateReviewInput {
  action: CandidateReviewAction;
  expectedRevision: number;
  reason: string;
  fields: CandidateReviewFields;
}

const actionConfig = {
  save: { workflowStatus: "needs_edit", historyAction: "edited" },
  approve: { workflowStatus: "approved", historyAction: "approved" },
  defer: { workflowStatus: "deferred", historyAction: "deferred" },
  reject: { workflowStatus: "rejected", historyAction: "rejected" },
} as const;

export function applyCandidateReview(
  candidate: CandidateData,
  input: CandidateReviewInput,
  reviewedAt = new Date().toISOString(),
): CandidateData {
  if (candidate.card.content_revision !== input.expectedRevision) {
    throw new Error("候选内容已被其他修改更新，请刷新页面后重试。");
  }
  if (!input.reason.trim()) throw new Error("请填写本次修改或审核理由。");
  if (candidate.workflow_status === "approved" && (input.action === "defer" || input.action === "reject")) {
    throw new Error("已发布卡不能直接暂缓或驳回；请先在正式卡管理中处理下线。");
  }

  const config = actionConfig[input.action];
  const next = structuredClone(candidate);
  next.workflow_status = config.workflowStatus;
  next.updated_at = reviewedAt;
  next.uncertainties = input.fields.uncertainties;
  next.card.translation_zh = input.fields.translationZh.trim();
  next.card.chunks = input.fields.chunks;
  next.card.pattern = input.fields.pattern;
  next.card.slots = input.fields.slots;
  next.card.grammar_note = input.fields.grammarNote;
  next.card.usage_note = input.fields.usageNote;
  next.card.simplified_version = input.fields.simplifiedVersion;
  next.card.transfer_example = input.fields.transferExample;
  next.card.exercise_seed = input.fields.exerciseSeed;
  next.card.content_status = config.workflowStatus;
  next.card.content_revision += 1;
  next.card.updated_at = reviewedAt;
  next.review_history.push({
    action: config.historyAction,
    reviewer: "local_user",
    reason: input.reason.trim(),
    reviewed_at: reviewedAt,
  });
  return next;
}
