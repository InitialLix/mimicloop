import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targetId = "0ed4e360-395a-5b3b-866b-b2371d09c541";
const repairedAt = "2026-08-19T04:10:00.000Z";
const reason = "修正 Use 目标短语边界，使 target_surface 与参考答案中的实际连续文本一致；未改变参考句或学习目标。";

for (const relativePath of ["data/candidate_collocations.json", "data/approved_collocations.seed.json"]) {
  const filename = path.join(root, relativePath);
  const items = JSON.parse(fs.readFileSync(filename, "utf8"));
  const item = items.find((entry) => entry.id === targetId);
  if (!item) throw new Error(`Missing ${targetId} in ${relativePath}`);
  item.exercise_seed.guided_application.target_surface = "have been taken over by";
  if (!item.review_history.some((event) => event.reason === reason)) {
    item.review_history.push({ action: "edited", reviewer: "codex", reason, reviewed_at: repairedAt });
    item.content_revision += 1;
    item.updated_at = repairedAt;
  }
  fs.writeFileSync(filename, `${JSON.stringify(items, null, 2)}\n`);
}

console.log("Repaired one reviewed target_surface in candidate and approved content.");
