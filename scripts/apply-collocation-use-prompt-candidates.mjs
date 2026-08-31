import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidatePath = path.join(root, "data/collocation_use_prompt_candidates.json");
const approvedPath = path.join(root, "data/approved_collocations.seed.json");
const candidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const collocations = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
const collocationsById = new Map(collocations.map((item) => [item.id, item]));
const now = new Date().toISOString();
let changed = 0;

const canonicalJson = (value) => {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalJson(item)]));
  }
  return value;
};

for (const item of candidates.items) {
  if (item.review_status !== "approved") continue;
  const collocation = collocationsById.get(item.collocation_id);
  if (!collocation) throw new Error(`Unknown approved collocation ${item.collocation_id}`);
  const nextSeed = {
    prompt_zh: item.prompt_zh,
    hints: item.hints,
    target_surface: item.target_surface,
    reference_answer: item.reference_answer,
    transfer_type: item.transfer_type,
  };
  collocation.exercise_seed ??= {};
  const current = collocation.exercise_seed.guided_application ?? null;
  if (JSON.stringify(canonicalJson(current)) === JSON.stringify(canonicalJson(nextSeed))) continue;
  collocation.exercise_seed.guided_application = nextSeed;
  collocation.content_revision += 1;
  collocation.updated_at = now;
  changed += 1;
}

fs.writeFileSync(approvedPath, `${JSON.stringify(collocations, null, 2)}\n`);
process.stdout.write(`Applied ${changed} approved Collocation Use prompt candidates.\n`);
