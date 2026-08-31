import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidatePath = path.join(root, "data/candidate_cards.json");
const approvedPath = path.join(root, "data/approved_cards.seed.json");
const fixedAt = "2026-08-18T17:45:00+08:00";
const editReason = "修复中文 Use 题干已经手写英文括注、页面又根据 hints 重复插入同一括注的问题；只删除题干中的重复英文，提示与参考答案不变。";

const stripEmbeddedHints = (seed) => {
  if (!seed?.prompt_zh || !Array.isArray(seed.hints)) return false;
  let nextPrompt = seed.prompt_zh;
  for (const hint of seed.hints) {
    nextPrompt = nextPrompt
      .replaceAll(`${hint.zh}（${hint.en}）`, hint.zh)
      .replaceAll(`${hint.zh} (${hint.en})`, hint.zh);
  }
  if (nextPrompt === seed.prompt_zh) return false;
  seed.prompt_zh = nextPrompt;
  return true;
};

const repairCard = (card) => {
  let changed = false;
  for (const seed of card.exercise_seed?.slot_replacement ?? []) {
    changed = stripEmbeddedHints(seed) || changed;
  }
  changed = stripEmbeddedHints(card.exercise_seed?.guided_application) || changed;
  if (!changed) return false;
  card.content_revision += 1;
  card.updated_at = fixedAt;
  return true;
};

const candidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const approvedCards = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
let candidateChanges = 0;
let approvedChanges = 0;

for (const candidate of candidates) {
  if (!repairCard(candidate.card)) continue;
  candidate.updated_at = fixedAt;
  candidate.review_history.push({
    action: "edited",
    reviewer: "codex",
    reason: editReason,
    reviewed_at: fixedAt,
  });
  candidateChanges += 1;
}

for (const card of approvedCards) {
  if (repairCard(card)) approvedChanges += 1;
}

if (candidateChanges !== approvedChanges) {
  throw new Error(`Candidate/approved repair mismatch: ${candidateChanges}/${approvedChanges}.`);
}

fs.writeFileSync(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
fs.writeFileSync(approvedPath, `${JSON.stringify(approvedCards, null, 2)}\n`, "utf8");
process.stdout.write(`Removed embedded duplicate hints from ${candidateChanges} candidate cards and ${approvedChanges} approved cards.\n`);
