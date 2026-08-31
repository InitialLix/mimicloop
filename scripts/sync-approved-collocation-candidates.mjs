import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidateFile = path.join(root, "data/candidate_collocations.json");
const approvedFile = path.join(root, "data/approved_collocations.seed.json");
const candidates = JSON.parse(fs.readFileSync(candidateFile, "utf8"));
const approved = JSON.parse(fs.readFileSync(approvedFile, "utf8"));
const approvedById = new Map(approved.map((item) => [item.id, item]));
let synced = 0;

const result = candidates.map((candidate) => {
  const published = approvedById.get(candidate.id);
  if (!published || published.content_revision < candidate.content_revision) return candidate;
  const draft = structuredClone(published);
  draft.workflow_status = "candidate";
  draft.exercise_seed = {};
  draft.review_history = draft.review_history.filter((event) => event.action !== "approved");
  draft.content_revision = Math.max(1, published.content_revision - 1);
  if (JSON.stringify(draft) !== JSON.stringify(candidate)) synced += 1;
  return draft;
});

fs.writeFileSync(candidateFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Synced ${synced} approved collocation candidates from the published seed.`);
