import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reclassifiedAt = "2026-08-19T04:20:00.000Z";
const canonicalTexts = new Set([
  "be lined up against",
  "get quite used to",
  "freedom from care",
  "grudge paying someone a high fee for something",
  "in times of real need",
  "live by doing something",
  "move from place to place with ease",
  "put someone in the same class as",
  "sleep in the open",
  "take one's mind off",
  "from humble beginnings",
]);
const reason = "按新版 Core / Appreciation 标准复核：表达自然，但叙事性、语域限制或主动迁移收益不足，改为仅在原文欣赏，不再进入 Recall → Use。";

for (const relativePath of ["data/candidate_collocations.json", "data/approved_collocations.seed.json"]) {
  const filename = path.join(root, relativePath);
  const items = JSON.parse(fs.readFileSync(filename, "utf8"));
  let changed = 0;
  for (const item of items) {
    if (!canonicalTexts.has(item.canonical_text) || item.learning_mode === "appreciation") continue;
    item.learning_mode = "appreciation";
    item.priority = "supporting";
    item.exercise_seed = {};
    item.selection_scores.active_recall_value = Math.min(item.selection_scores.active_recall_value, 2);
    item.selection_scores.transfer_value = Math.min(item.selection_scores.transfer_value, 3);
    item.review_history.push({ action: "edited", reviewer: "codex", reason, reviewed_at: reclassifiedAt });
    item.content_revision += 1;
    item.updated_at = reclassifiedAt;
    changed += 1;
  }
  fs.writeFileSync(filename, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${relativePath}: ${changed} reclassified`);
}
