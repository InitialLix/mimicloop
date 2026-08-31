import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filePath = path.join(root, "data/collocation_use_prompt_candidates.json");
const batch = JSON.parse(fs.readFileSync(filePath, "utf8"));
const reviewedAt = "2026-08-18T17:45:00+08:00";
let changed = 0;

for (const item of batch.items) {
  item.review_history ??= [{
    action: "created",
    reviewer: "codex",
    reason: "根据已审核搭配与迁移训练规范生成换场景中译英候选，等待人工审核。",
    reviewed_at: batch.generated_at,
  }];
  if (item.review_status === "approved") continue;
  item.review_status = "approved";
  item.review_history.push({
    action: "approved",
    reviewer: "local_user",
    reason: "用户在审核页查看《新概念英语 3》本批 21 条 Use 题后表示“暂时都通过”，并要求加入正式练习。",
    reviewed_at: reviewedAt,
  });
  changed += 1;
}

fs.writeFileSync(filePath, `${JSON.stringify(batch, null, 2)}\n`);
process.stdout.write(`Approved ${changed} Collocation Use prompt candidates.\n`);
