import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidatePath = path.join(root, "data/use_prompt_candidates.json");
const approvedPath = path.join(root, "data/approved_cards.seed.json");
const candidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const cards = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
const cardsById = new Map(cards.map((card) => [card.id, card]));
const now = new Date().toISOString();
let changed = 0;
const sameHints = (left = [], right = []) =>
  left.length === right.length
  && left.every((item, index) => item.zh === right[index]?.zh && item.en === right[index]?.en);
const canonicalJson = (value) => {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalJson(item)]),
    );
  }
  return value;
};

for (const item of candidates.items) {
  if (item.review_status !== "approved") continue;
  const card = cardsById.get(item.card_id);
  if (!card) throw new Error(`Unknown approved card ${item.card_id}`);

  if (item.mode === "structure") {
    const seed = card.exercise_seed.slot_replacement?.[0];
    if (!seed) throw new Error(`Missing slot replacement seed for ${item.card_id}`);
    const nextHints = item.hints;
    if (seed.prompt_zh === item.prompt_zh
      && seed.feedback_pattern === item.feedback_pattern
      && sameHints(seed.hints, nextHints)) continue;
    seed.prompt_zh = item.prompt_zh;
    seed.hints = nextHints;
    seed.feedback_pattern = item.feedback_pattern;
    card.schema_version = "1.1.0";
  } else {
    const nextSeed = {
      prompt_zh: item.prompt_zh,
      hints: item.hints,
      target_chunk: item.target_chunk,
      reference_answer: item.reference_answer
    };
    if (JSON.stringify(canonicalJson(card.exercise_seed.guided_application ?? null)) === JSON.stringify(canonicalJson(nextSeed))) continue;
    card.exercise_seed.guided_application = nextSeed;
  }

  card.content_revision += 1;
  card.updated_at = now;
  changed += 1;
}

fs.writeFileSync(approvedPath, `${JSON.stringify(cards, null, 2)}\n`);
process.stdout.write(`Applied ${changed} approved Use prompt candidates.\n`);
