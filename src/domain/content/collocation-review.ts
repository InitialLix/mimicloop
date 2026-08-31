import { createHash } from "node:crypto";
import type {
  CollocationData,
  CollocationReviewAction,
  CollocationReviewFields,
} from "../../lib/content-types";

const normalizeCollocation = (text: string) => text
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[.!?,;:]+$/g, "")
  .replace(/\s+/g, " ")
  .trim();

export interface CollocationReviewInput {
  action: CollocationReviewAction;
  expectedRevision: number;
  reason: string;
  mergeTargetId?: string | null;
  fields: CollocationReviewFields;
}

const actionConfig = {
  save: { workflowStatus: "needs_edit", historyAction: "edited" },
  approve: { workflowStatus: "approved", historyAction: "approved" },
  defer: { workflowStatus: "deferred", historyAction: "deferred" },
  reject: { workflowStatus: "rejected", historyAction: "rejected" },
  merge: { workflowStatus: "merged", historyAction: "merged" },
} as const;

export function applyCollocationReview(
  candidate: CollocationData,
  input: CollocationReviewInput,
  reviewedAt = new Date().toISOString(),
): CollocationData {
  if (candidate.content_revision !== input.expectedRevision) {
    throw new Error("候选搭配已被其他修改更新，请刷新页面后重试。");
  }
  if (!input.reason.trim()) throw new Error("请填写本次修改或审核理由。");
  if (candidate.workflow_status === "approved" && input.action !== "approve") {
    throw new Error("已发布搭配不能在候选审核中改为其他状态。");
  }
  if (input.action === "merge") {
    if (!input.mergeTargetId) throw new Error("合并时请选择目标搭配。");
    if (input.mergeTargetId === candidate.id) throw new Error("候选搭配不能合并到自身。");
  }

  const config = actionConfig[input.action];
  const next = structuredClone(candidate);
  next.workflow_status = config.workflowStatus;
  next.updated_at = reviewedAt;
  next.canonical_text = input.fields.canonicalText.trim();
  const normalizedText = normalizeCollocation(next.canonical_text);
  next.normalized_text_hash = createHash("sha256").update(normalizedText).digest("hex");
  next.deduplication.group_key = normalizedText;
  next.translation_prompt = input.fields.translationPrompt.trim();
  next.pattern = input.fields.pattern;
  next.slots = input.fields.slots;
  next.expression_type = input.fields.expressionType;
  next.grammar_pattern = input.fields.grammarPattern;
  next.usage_note = input.fields.usageNote;
  next.common_error = input.fields.commonError;
  next.accepted_answers = input.fields.acceptedAnswers;
  next.topics = input.fields.topics;
  next.argument_functions = input.fields.argumentFunctions;
  next.uncertainties = input.fields.uncertainties;
  next.deduplication.merge_target_id = input.action === "merge" ? input.mergeTargetId ?? null : null;
  next.content_revision += 1;
  next.review_history.push({
    action: config.historyAction,
    reviewer: "local_user",
    reason: input.reason.trim(),
    reviewed_at: reviewedAt,
  });
  return next;
}
