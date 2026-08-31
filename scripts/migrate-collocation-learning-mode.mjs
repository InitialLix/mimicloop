import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const files = [
  "data/candidate_collocations.json",
  "data/approved_collocations.seed.json",
];
const migratedAt = "2026-08-19T01:00:00.000Z";

for (const relativePath of files) {
  const filename = path.join(projectRoot, relativePath);
  const items = JSON.parse(fs.readFileSync(filename, "utf8"));
  let changedCount = 0;

  for (const item of items) {
    if (item.schema_version === "1.2.0" && item.learning_mode) continue;
    item.schema_version = "1.2.0";
    item.learning_mode = "recall_use";
    item.provenance.guideline_version = "1.2.0";
    item.review_history.push({
      action: "edited",
      reviewer: "codex",
      reason: "内容模型升级：现有主动学习搭配统一归入 Core（Recall → Use）；Appreciation 将作为独立的原文欣赏标注，不进入复习队列。",
      reviewed_at: migratedAt,
    });
    item.content_revision += 1;
    item.updated_at = migratedAt;
    changedCount += 1;
  }

  fs.writeFileSync(filename, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${relativePath}: ${changedCount} migrated`);
}
