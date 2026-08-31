import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const promptVersion = "nce3-high-recall-core-appreciation-v1";
const approvedAt = "2026-08-19T04:00:00.000Z";
const candidateFile = path.join(root, "data/candidate_collocations.json");
const approvedFile = path.join(root, "data/approved_collocations.seed.json");
const candidates = JSON.parse(fs.readFileSync(candidateFile, "utf8"));
const approved = JSON.parse(fs.readFileSync(approvedFile, "utf8"));
const approvedById = new Map(approved.map((item) => [item.id, item]));
let count = 0;

for (const candidate of candidates) {
  if (candidate.provenance?.prompt_version !== promptVersion) continue;
  const published = structuredClone(candidate);
  published.workflow_status = "approved";
  published.review_history.push({
    action: "approved",
    reviewer: "user",
    reason: "用户已授权本轮新概念课文内容在完成高召回、查重、现代英语自然度及 Core / Appreciation 分层检查后默认发布。",
    reviewed_at: approvedAt,
  });
  published.content_revision += 1;
  published.updated_at = approvedAt;
  approvedById.set(candidate.id, published);
  count += 1;
}

fs.writeFileSync(candidateFile, `${JSON.stringify(candidates, null, 2)}\n`);
fs.writeFileSync(approvedFile, `${JSON.stringify([...approvedById.values()], null, 2)}\n`);
console.log(`Approved ${count} Core/Appreciation expressions.`);
