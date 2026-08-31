import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filePath = path.join(root, "data/approved_collocations.seed.json");
const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
const updatedAt = "2026-08-18T09:35:00.000Z";
let changed = 0;
for (const item of items) {
  const needsSchemaBump = item.exercise_seed && (
    item.content_revision === 2
    || (item.content_revision === 3 && item.updated_at !== updatedAt)
  );
  if (!needsSchemaBump) continue;
  item.content_revision += 1;
  item.updated_at = updatedAt;
  changed += 1;
}
fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`);
process.stdout.write(`Bumped ${changed} approved collocation schema revisions.\n`);
