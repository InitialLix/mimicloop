import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const relativePath of ["data/candidate_collocations.json", "data/approved_collocations.seed.json"]) {
  const filePath = path.join(root, relativePath);
  const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const item of items) item.exercise_seed ??= {};
  fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`);
  process.stdout.write(`Migrated ${items.length} items in ${relativePath}.\n`);
}
