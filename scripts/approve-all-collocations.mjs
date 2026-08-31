import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const inputPath = path.join(projectRoot, "data", "candidate_collocations.json");
const outputPath = path.join(projectRoot, "data", "approved_collocations.seed.json");
const firstDecision = {
  reviewedAt: "2026-08-17T08:30:00.000Z",
  reason: "用户已确认首批从正式句子卡提取的搭配内容没有问题，并要求继续推进；本次批准仅覆盖至少关联一张正式句子卡的原首批 86 条，普通正文新增候选继续保留候选态。",
};
const remainingDecision = {
  reviewedAt: "2026-08-17T09:00:00.000Z",
  reason: "用户在首批 86 条发布后明确批准剩余全部 Collocation 候选；本次追加批准此前未进入 approved seed 的 114 条普通正文候选。",
};
const transferGuidanceDecision = {
  reviewedAt: "2026-08-17T09:07:27.863Z",
  reason: "用户明确指出原 pattern 过度绑定 economy，要求改为能连接不同名词结果的跨主题搭配变化；已按该意见修订并继续保持批准态。",
};

const candidates = JSON.parse(await readFile(inputPath, "utf8"));
if (!Array.isArray(candidates) || candidates.length !== 200) {
  throw new Error("Expected candidate_collocations.json to contain exactly 200 candidates");
}

let firstCount = 0;
let remainingCount = 0;
const approved = candidates.map((candidate) => {
  const decision = candidate.source_links.some((link) => link.card_id !== null)
    ? (firstCount += 1, firstDecision)
    : (remainingCount += 1, remainingDecision);
  const wasTransferGuidanceEdited = candidate.canonical_text === "contribute to the economy";
  return {
    ...structuredClone(candidate),
    workflow_status: "approved",
    content_revision: candidate.content_revision + (wasTransferGuidanceEdited ? 2 : 1),
    updated_at: wasTransferGuidanceEdited ? transferGuidanceDecision.reviewedAt : decision.reviewedAt,
    deduplication: {
      ...candidate.deduplication,
      merge_target_id: null,
    },
    review_history: [
      ...candidate.review_history,
      {
        action: "approved",
        reviewer: "local_user",
        reason: decision.reason,
        reviewed_at: decision.reviewedAt,
      },
      ...(wasTransferGuidanceEdited ? [{
        action: "edited",
        reviewer: "local_user",
        reason: transferGuidanceDecision.reason,
        reviewed_at: transferGuidanceDecision.reviewedAt,
      }] : []),
    ],
  };
}).sort((left, right) => left.canonical_text.localeCompare(right.canonical_text, "en"));

if (firstCount !== 86 || remainingCount !== 114 || new Set(approved.map((item) => item.id)).size !== 200) {
  throw new Error(`Approval scope mismatch: first=${firstCount}, remaining=${remainingCount}`);
}

await writeFile(outputPath, `${JSON.stringify(approved, null, 2)}\n`, "utf8");
process.stdout.write(`Wrote ${approved.length} approved collocations (${firstCount} first-batch + ${remainingCount} remaining).\n`);
