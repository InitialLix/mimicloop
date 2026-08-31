import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const sources = readJson("data/source_essays.json");
const cards = readJson("data/approved_cards.seed.json");

const splitSentences = (paragraph) =>
  (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const cardByLocation = new Map();
for (const card of cards) {
  const key = `${card.source_essay_id}:${card.paragraph_index}:${card.sentence_index}`;
  if (cardByLocation.has(key)) throw new Error(`Multiple approved cards share source location ${key}`);
  cardByLocation.set(key, card);
}

const inventory = sources.flatMap((source) =>
  source.paragraphs.flatMap((paragraph) =>
    splitSentences(paragraph.text).map((sentenceText, sentenceIndex) => {
      const key = `${source.id}:${paragraph.paragraph_index}:${sentenceIndex}`;
      const card = cardByLocation.get(key) ?? null;
      if (card && card.original_sentence !== sentenceText) {
        throw new Error(`Approved card ${card.id} does not match source sentence ${key}`);
      }
      return {
        source_essay_id: source.id,
        source_title: source.title,
        paragraph_index: paragraph.paragraph_index,
        sentence_index: sentenceIndex,
        sentence_text: sentenceText,
        card_id: card?.id ?? null
      };
    })
  )
);

const inventoryKeys = new Set(
  inventory.map((item) => `${item.source_essay_id}:${item.paragraph_index}:${item.sentence_index}`)
);
for (const key of cardByLocation.keys()) {
  if (!inventoryKeys.has(key)) throw new Error(`Approved card location is absent from source inventory: ${key}`);
}

const uncarded = inventory.filter((item) => item.card_id === null);
const stats = {
  source_essays: sources.length,
  source_sentences: inventory.length,
  sentences_with_approved_card: inventory.length - uncarded.length,
  sentences_without_approved_card: uncarded.length
};

process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
if (process.argv.includes("--list-unlinked")) {
  for (const item of uncarded) {
    process.stdout.write(
      `\n[${item.source_title}] p${item.paragraph_index} s${item.sentence_index}\n${item.sentence_text}\n`
    );
  }
}
