import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const batchKey = process.argv[2] ?? "18-27";
const batchConfig = {
  "18-27": {
    promptVersion: "nce3-language-richness-v1",
    reviewFile: "nce3-candidate-review.md",
    sentenceCount: 5,
    collocationCount: 21,
    approvedAt: "2026-08-18T16:45:00+08:00",
    approvalReason: "用户确认《新概念英语 3》第 18、27 课本批内容都可以，并要求整批发布；同时明确后续处理应优先筛选完整句子的框架与自然写法，Collocation 作为并列但次一级的学习对象。",
  },
  "29-59": {
    promptVersion: "nce3-language-richness-lessons-29-59-v1",
    reviewFile: "nce3-lessons-29-59-candidate-review.md",
    sentenceCount: 29,
    collocationCount: 36,
    approvedAt: "2026-08-19T03:30:00+08:00",
    approvalReason: "用户于 2026-08-19 明确要求第 29、38、41、44、45、47、51、53、55、59 课全部完成后无需逐条复核，允许在原文归档、查重、Use 练习、native-naturalness 检查与确定性验证全部通过后整批发布到网页。",
  },
}[batchKey];
if (!batchConfig) throw new Error(`Unknown NCE3 approval batch '${batchKey}'.`);
const files = {
  candidates: path.join(root, "data/candidate_cards.json"),
  approvedCards: path.join(root, "data/approved_cards.seed.json"),
  collocationCandidates: path.join(root, "data/candidate_collocations.json"),
  approvedCollocations: path.join(root, "data/approved_collocations.seed.json"),
  review: path.join(root, "sources/metadata", batchConfig.reviewFile),
};
const { promptVersion, approvedAt, approvalReason } = batchConfig;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const isNce = (item) => item.provenance?.prompt_version === promptVersion;
const hasApproval = (history) => history.some((event) => event.action === "approved" && event.reason === approvalReason);
const locationKey = (sourceId, paragraphIndex, sentenceIndex) => `${sourceId}:${paragraphIndex}:${sentenceIndex}`;

const candidates = readJson(files.candidates);
const approvedCards = readJson(files.approvedCards);
const nceCandidates = candidates.filter(isNce);
if (nceCandidates.length !== batchConfig.sentenceCount) throw new Error(`Expected ${batchConfig.sentenceCount} NCE3 sentence candidates, found ${nceCandidates.length}.`);

const approvedCardById = new Map(approvedCards.map((card) => [card.id, card]));
let sentenceApprovals = 0;
const nextCandidates = candidates.map((candidate) => {
  if (!isNce(candidate)) return candidate;
  const existing = approvedCardById.get(candidate.card.id);
  const cardChanged = existing && (
    existing.transfer_example !== candidate.card.transfer_example
    || JSON.stringify(existing.exercise_seed) !== JSON.stringify(candidate.card.exercise_seed)
  );
  const approvedCard = !existing || cardChanged ? {
    ...structuredClone(candidate.card),
    content_status: "approved",
    content_revision: existing ? existing.content_revision + 1 : candidate.card.content_revision + 1,
    updated_at: approvedAt,
  } : existing;
  approvedCardById.set(approvedCard.id, approvedCard);
  if (candidate.workflow_status !== "approved") sentenceApprovals += 1;
  return {
    ...candidate,
    card: approvedCard,
    workflow_status: "approved",
    review_history: hasApproval(candidate.review_history) ? candidate.review_history : [
      ...candidate.review_history,
      { action: "approved", reviewer: "local_user", reason: approvalReason, reviewed_at: approvedAt },
    ],
    updated_at: approvedAt,
  };
});

const nextApprovedCards = [...approvedCardById.values()];
const cardByLocation = new Map(nextApprovedCards.map((card) => [
  locationKey(card.source_essay_id, card.paragraph_index, card.sentence_index),
  card,
]));

const collocationCandidates = readJson(files.collocationCandidates);
const approvedCollocations = readJson(files.approvedCollocations);
const nceCollocationCandidates = collocationCandidates.filter(isNce);
if (nceCollocationCandidates.length !== batchConfig.collocationCount) {
  throw new Error(`Expected ${batchConfig.collocationCount} NCE3 Collocation candidates, found ${nceCollocationCandidates.length}.`);
}

let linkedToCards = 0;
const nextCollocationCandidates = collocationCandidates.map((candidate) => {
  if (!isNce(candidate)) return candidate;
  let changed = false;
  const sourceLinks = candidate.source_links.map((link) => {
    const card = cardByLocation.get(locationKey(link.source_essay_id, link.paragraph_index, link.sentence_index));
    if (!card || !card.learning_sentence.includes(link.surface_form)) return link;
    if (link.card_id === card.id && link.learning_surface_form === link.surface_form) return link;
    changed = true;
    linkedToCards += 1;
    return {
      ...link,
      card_id: card.id,
      learning_surface_form: link.surface_form,
      learning_occurrence_index: link.occurrence_index,
    };
  });
  if (!changed) return candidate;
  return {
    ...candidate,
    source_links: sourceLinks,
    content_revision: candidate.content_revision + 1,
    review_history: [
      ...candidate.review_history,
      {
        action: "edited",
        reviewer: "codex",
        reason: "句子卡获批后补全同一原句中的正式卡关联；未改变搭配正文或学习范围。",
        reviewed_at: approvedAt,
      },
    ],
    updated_at: approvedAt,
  };
});

const approvedCollocationById = new Map(approvedCollocations.map((item) => [item.id, item]));
let collocationApprovals = 0;
for (const candidate of nextCollocationCandidates.filter(isNce)) {
  const existing = approvedCollocationById.get(candidate.id);
  const exerciseChanged = existing
    && JSON.stringify(existing.exercise_seed) !== JSON.stringify(candidate.exercise_seed);
  if (existing && !exerciseChanged) continue;
  approvedCollocationById.set(candidate.id, {
    ...structuredClone(candidate),
    workflow_status: "approved",
    content_revision: existing ? existing.content_revision + 1 : candidate.content_revision + 1,
    review_history: [
      ...candidate.review_history,
      { action: "approved", reviewer: "local_user", reason: approvalReason, reviewed_at: approvedAt },
    ],
    updated_at: approvedAt,
  });
  collocationApprovals += 1;
}

const nextApprovedCollocations = [...approvedCollocationById.values()]
  .sort((left, right) => left.canonical_text.localeCompare(right.canonical_text, "en"));

writeJson(files.candidates, nextCandidates);
writeJson(files.approvedCards, nextApprovedCards);
writeJson(files.collocationCandidates, nextCollocationCandidates);
writeJson(files.approvedCollocations, nextApprovedCollocations);

const reviewText = fs.readFileSync(files.review, "utf8");
const withoutPreviousDecision = reviewText.split("\n## 审核决定\n")[0].trimEnd();
fs.writeFileSync(files.review, `${withoutPreviousDecision}\n\n## 审核决定\n\n- 审核时间：${approvedAt}\n- 句子：${batchConfig.sentenceCount} 条整批批准并发布。\n- Collocation：${batchConfig.collocationCount} 条整批批准并发布。\n- 后续优先级：先筛完整句子的框架与自然写法，再筛 Collocation；两者分别作为学习对象。\n- 审核理由：${approvalReason}\n`, "utf8");

process.stdout.write(
  `Published NCE3 content: ${sentenceApprovals} new sentence approvals, ${collocationApprovals} new Collocation approvals, ${linkedToCards} new card links.\n`,
);
