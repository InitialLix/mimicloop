import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "source_essays.json");
const createdAt = "2026-08-18T08:00:00.000Z";

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function uuidFrom(seed) {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const lessons = [
  {
    lesson: 18,
    title: "Electric Currents in Modern Art",
    question: "How might some of the exhibits have been dangerous?",
    topics: ["culture_art_language_media", "science_space_ethics"],
    url: "https://nce.luzhenhua.cn/NCE3/18-electric-currents-in-modern-art.html",
  },
  {
    lesson: 27,
    title: "Nothing to Sell and Nothing to Buy",
    question: "What is the most important thing for a tramp?",
    topics: ["society_family_population_equality", "work_economy_business_consumption"],
    url: "https://nce.luzhenhua.cn/NCE3/27-nothing-to-sell-and-nothing-to-buy.html",
  },
  {
    lesson: 29,
    title: "Funny or Not",
    question: "What is the basis of 'sick' humour?",
    topics: ["culture_art_language_media", "society_family_population_equality"],
    url: "https://nce.luzhenhua.cn/NCE3/29-funny-or-not.html",
    sourceType: "public_web",
  },
  {
    lesson: 38,
    title: "The First Calendar",
    question: "What is the importance of the dots, lines, and symbols engraved on stone, bones and ivory?",
    topics: ["science_space_ethics", "culture_art_language_media"],
    url: "https://nce.luzhenhua.cn/NCE3/38-the-first-calendar.html",
    sourceType: "public_web",
  },
  {
    lesson: 41,
    title: "Illusions of Pastoral Peace",
    question: "What particular anxiety spoils the country dweller's visit to the theatre?",
    topics: ["cities_housing_transport", "society_family_population_equality"],
    url: "https://nce.luzhenhua.cn/NCE3/41-illusions-of-pastoral-peace.html",
    sourceType: "public_web",
  },
  {
    lesson: 44,
    title: "Speed and Comfort",
    question: "Which type of transport does the writer prefer?",
    topics: ["cities_housing_transport", "globalization_tourism_migration"],
    url: "https://nce.luzhenhua.cn/NCE3/44-speed-and-comfort.html",
    sourceType: "public_web",
  },
  {
    lesson: 45,
    title: "The Power of the Press",
    question: "Does the writer think the parents were lucky or unlucky to gain prosperity in this way? Why?",
    topics: ["culture_art_language_media", "government_public_policy_spending"],
    url: "https://nce.luzhenhua.cn/NCE3/45-the-power-of-the-press.html",
    sourceType: "public_web",
  },
  {
    lesson: 47,
    title: "Too High a Price",
    question: "What does the writer describe as an 'amusing old-fashioned source of noise'?",
    topics: ["environment_energy_animals", "cities_housing_transport"],
    url: "https://nce.luzhenhua.cn/NCE3/47-too-high-a-price.html",
    sourceType: "public_web",
  },
  {
    lesson: 51,
    title: "Predicting the Future",
    question: "What was the future electronic development that Leon Bagrit was not able to foresee?",
    topics: ["technology_ai_digital_media", "work_economy_business_consumption"],
    url: "https://nce.luzhenhua.cn/NCE3/51-predicting-the-future.html",
    sourceType: "public_web",
  },
  {
    lesson: 53,
    title: "In the Public Interest",
    question: "What could not be reported in the official files?",
    topics: ["government_public_policy_spending", "crime_law_punishment"],
    url: "https://nce.luzhenhua.cn/NCE3/53-in-the-public-interest.html",
    sourceType: "public_web",
  },
  {
    lesson: 55,
    title: "From the Earth: Greetings",
    question: "Which life forms are most likely to develop on a distant planet?",
    topics: ["science_space_ethics", "environment_energy_animals"],
    url: "https://nce.luzhenhua.cn/NCE3/55-from-the-earth-greetings.html",
    sourceType: "public_web",
  },
  {
    lesson: 59,
    title: "Collecting",
    question: "What in particular does a person gain when he or she becomes a serious collector?",
    topics: ["culture_art_language_media", "society_family_population_equality"],
    url: "https://nce.luzhenhua.cn/NCE3/59-collecting.html",
    sourceType: "public_web",
  },
];

const generated = lessons.map((lesson) => {
  const relativeTextPath = `sources/raw/new-concept-english-3/lesson-${lesson.lesson}.txt`;
  const relativeScanPath = `sources/raw/new-concept-english-3/lesson-${lesson.lesson}-scan.png`;
  const fullText = fs.readFileSync(path.join(root, relativeTextPath), "utf8").trim();
  const paragraphTexts = fullText.split(/\r?\n\r?\n/);
  if (paragraphTexts.length < 2 || paragraphTexts.some((item) => !item.trim())) {
    throw new Error(`Lesson ${lesson.lesson} must preserve at least two non-empty textbook paragraphs.`);
  }
  return {
    schema_version: "1.0.0",
    id: uuidFrom(`source:new-concept-english-3:lesson-${lesson.lesson}`),
    title: lesson.title,
    ielts_prompt: null,
    full_text: fullText,
    paragraphs: paragraphTexts.map((text, paragraphIndex) => ({
      paragraph_index: paragraphIndex,
      text,
      content_hash: sha256(text),
    })),
    source_name: "新概念英语 3",
    content_role: "language_richness_corpus",
    source_type: lesson.sourceType ?? "scanned_book",
    answer_origin: "published_language_textbook",
    source_url: lesson.url,
    publication_ref: lesson.sourceType === "public_web"
      ? `New Concept English 3, Lesson ${lesson.lesson}; question: ${lesson.question}; web transcript verified against ${lesson.url}`
      : `New Concept English 3, Lesson ${lesson.lesson}; question: ${lesson.question}; scan: ${relativeScanPath}`,
    author: "L. G. Alexander",
    question_type: "not_applicable",
    topics: lesson.topics,
    claimed_band: null,
    examiner_comments: null,
    accessed_at: createdAt,
    local_raw_file: relativeTextPath,
    content_hash: sha256(fullText),
    rights_note: lesson.sourceType === "public_web"
      ? "Publicly accessible web transcript archived for personal language study. Treat only as a language-richness corpus, not as an IELTS model essay; retain source attribution and do not redistribute the textbook text."
      : "User-provided textbook scan and locally verified transcription for personal study. Treat only as a language-richness corpus, not as an IELTS model essay; retain the scan beside the transcript and do not redistribute the textbook text.",
    created_at: createdAt,
    updated_at: createdAt,
  };
});

const existing = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const generatedIds = new Set(generated.map((source) => source.id));
const merged = [...existing.filter((source) => !generatedIds.has(source.id)), ...generated];
fs.writeFileSync(sourcePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

for (const source of generated) {
  process.stdout.write(`Imported ${source.title} as ${source.id}; ${source.paragraphs.length} paragraphs; ${source.content_hash}.\n`);
}
