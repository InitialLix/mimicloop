import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaFiles = [
  "schemas/common.schema.json",
  "schemas/source-essay.schema.json",
  "schemas/guided-writing-prompt.schema.json",
  "schemas/sentence-card.schema.json",
  "schemas/candidate-card.schema.json",
  "schemas/collocation.schema.json",
  "schemas/backup.schema.json",
  "schemas/guided-writing-coach.schema.json",
  "schemas/use-prompt-candidates.schema.json",
  "schemas/collocation-use-prompt-candidates.schema.json"
];

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const schemaFile of schemaFiles) {
  ajv.addSchema(readJson(schemaFile));
}

const schemaIds = {
  source: "https://mimicloop.local/schemas/source-essay.schema.json",
  guidedWritingPrompt: "https://mimicloop.local/schemas/guided-writing-prompt.schema.json",
  card: "https://mimicloop.local/schemas/sentence-card.schema.json",
  candidate: "https://mimicloop.local/schemas/candidate-card.schema.json",
  collocation: "https://mimicloop.local/schemas/collocation.schema.json",
  backup: "https://mimicloop.local/schemas/backup.schema.json",
  guidedWritingCoach: "https://mimicloop.local/schemas/guided-writing-coach.schema.json",
  usePrompts: "https://mimicloop.local/schemas/use-prompt-candidates.schema.json",
  collocationUsePrompts: "https://mimicloop.local/schemas/collocation-use-prompt-candidates.schema.json"
};

for (const schemaId of Object.values(schemaIds)) {
  ajv.getSchema(schemaId);
}

const formatErrors = (errors = []) =>
  errors
    .map((error) => {
      const location = error.instancePath || "/";
      const detail = error.params?.additionalProperty
        ? `: ${error.params.additionalProperty}`
        : "";
      return `${location} ${error.message}${detail}`;
    })
    .join("\n");

const placeholders = (pattern) =>
  new Set([...(pattern ?? "").matchAll(/\{([a-z][a-z0-9_]*)\}/g)].map((match) => match[1]));

const feedbackPatternMatches = (pattern, referenceAnswer) => {
  let cursor = 0;
  for (const fixedText of pattern.split(/\{[a-z][a-z0-9_]*\}/g).filter(Boolean)) {
    const index = referenceAnswer.indexOf(fixedText, cursor);
    if (index < 0) return false;
    cursor = index + fixedText.length;
  }
  return true;
};

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

const normalizeSentence = (text) => text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const normalizeCollocation = (text) => text
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[.!?,;:]+$/g, "")
  .replace(/\s+/g, " ")
  .trim();

const occurrenceExists = (text, needle, occurrenceIndex) => {
  let cursor = 0;
  for (let index = 0; index <= occurrenceIndex; index += 1) {
    const found = text.indexOf(needle, cursor);
    if (found < 0) return false;
    cursor = found + needle.length;
  }
  return true;
};

const splitSentences = (paragraph) =>
  (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

function semanticSourceErrors(source) {
  const errors = [];
  const joined = (source.paragraphs ?? []).map((paragraph) => paragraph.text).join("\n\n");
  if (joined !== source.full_text) {
    errors.push("full_text must equal paragraphs joined by two newlines");
  }
  if (sha256(source.full_text) !== source.content_hash) {
    errors.push("source content_hash does not match full_text");
  }
  for (const [index, paragraph] of (source.paragraphs ?? []).entries()) {
    if (paragraph.paragraph_index !== index) {
      errors.push(`paragraph_index must be contiguous; expected ${index}`);
    }
    if (sha256(paragraph.text) !== paragraph.content_hash) {
      errors.push(`paragraph ${paragraph.paragraph_index} content_hash does not match text`);
    }
  }
  return errors;
}

function semanticCardErrors(card) {
  const errors = [];

  if (sha256(normalizeSentence(card.learning_sentence)) !== card.normalized_text_hash) {
    errors.push("normalized_text_hash does not match learning_sentence");
  }

  for (const chunk of card.chunks ?? []) {
    if (!card.learning_sentence.includes(chunk.text)) {
      errors.push(`chunk '${chunk.text}' does not occur in learning_sentence`);
    }
  }

  for (const gloss of card.glosses ?? []) {
    const occurrences = card.learning_sentence.split(gloss.text).length - 1;
    if (occurrences <= gloss.occurrence_index) {
      errors.push(
        `gloss '${gloss.text}' occurrence_index=${gloss.occurrence_index} does not occur in learning_sentence`
      );
    }
  }

  const patternSlots = placeholders(card.pattern);
  const declaredSlots = new Set((card.slots ?? []).map((slot) => slot.name));
  for (const name of patternSlots) {
    if (!declaredSlots.has(name)) errors.push(`pattern placeholder '${name}' has no slot`);
  }
  for (const name of declaredSlots) {
    if (!patternSlots.has(name)) errors.push(`slot '${name}' does not occur in pattern`);
  }

  for (const exercise of card.exercise_seed?.chunk_cloze ?? []) {
    if (exercise.chunk_text !== exercise.reference_answer) {
      errors.push(`chunk cloze answer does not equal chunk_text '${exercise.chunk_text}'`);
    }
    if (!(card.chunks ?? []).some((chunk) => chunk.text === exercise.chunk_text)) {
      errors.push(`chunk cloze target '${exercise.chunk_text}' is not a declared chunk`);
    }
  }

  for (const exercise of card.exercise_seed?.slot_replacement ?? []) {
    if (exercise.feedback_pattern) {
      if (card.schema_version !== "1.1.0") {
        errors.push("feedback_pattern requires sentence card schema_version 1.1.0");
      }
      if (!feedbackPatternMatches(exercise.feedback_pattern, exercise.reference_answer)) {
        errors.push("feedback_pattern fixed text does not match the Use reference_answer");
      }
    }
    for (const value of exercise.slot_values) {
      if (!declaredSlots.has(value.slot_name)) {
        errors.push(`slot replacement uses undeclared slot '${value.slot_name}'`);
      }
    }
  }

  if (
    card.exercise_seed?.translation_recall?.reference_answer &&
    card.exercise_seed.translation_recall.reference_answer !== card.learning_sentence
  ) {
    errors.push("translation recall reference_answer must equal learning_sentence");
  }

  if (card.learning_edits?.length === 0 && card.original_sentence !== card.learning_sentence) {
    errors.push("learning_sentence differs from original_sentence but learning_edits is empty");
  }
  if (card.learning_edits?.length > 0 && card.original_sentence === card.learning_sentence) {
    errors.push("learning_edits is not empty but learning_sentence is unchanged");
  }
  for (const edit of card.learning_edits ?? []) {
    if (!card.original_sentence.includes(edit.before)) {
      errors.push(`learning edit before text '${edit.before}' does not occur in original_sentence`);
    }
    if (!card.learning_sentence.includes(edit.after)) {
      errors.push(`learning edit after text '${edit.after}' does not occur in learning_sentence`);
    }
  }

  return errors;
}

function semanticCandidateErrors(candidate, sourcesById) {
  const errors = semanticCardErrors(candidate.card);
  const card = candidate.card;

  if (candidate.workflow_status !== card.content_status) {
    errors.push("candidate workflow_status must equal card content_status");
  }
  if (candidate.source_match.paragraph_index !== card.paragraph_index) {
    errors.push("source_match paragraph_index differs from card paragraph_index");
  }
  if (candidate.source_match.sentence_index !== card.sentence_index) {
    errors.push("source_match sentence_index differs from card sentence_index");
  }
  if (candidate.source_match.matched_text !== card.original_sentence) {
    errors.push("source_match matched_text differs from original_sentence");
  }

  const source = sourcesById.get(card.source_essay_id);
  if (source) {
    const paragraph = source.paragraphs.find(
      (item) => item.paragraph_index === card.paragraph_index
    );
    if (!paragraph) {
      errors.push(`source paragraph ${card.paragraph_index} does not exist`);
    } else {
      const sentences = splitSentences(paragraph.text);
      if (!paragraph.text.includes(card.original_sentence)) {
        errors.push("original_sentence does not occur in the located source paragraph");
      }
      if (sentences[card.sentence_index] !== card.original_sentence) {
        errors.push("sentence_index does not point to original_sentence");
      }
      if (card.context_before !== (sentences[card.sentence_index - 1] ?? "")) {
        errors.push("context_before is not the immediately preceding source sentence");
      }
      if (card.context_after !== (sentences[card.sentence_index + 1] ?? "")) {
        errors.push("context_after is not the immediately following source sentence");
      }
    }
  }

  if (
    candidate.workflow_status === "approved" &&
    !candidate.review_history.some((event) => event.action === "approved")
  ) {
    errors.push("approved candidate has no approved review event");
  }

  return errors;
}

function semanticCollocationErrors(collocation, cardsById, sourcesById) {
  const errors = [];
  const normalizedCanonical = normalizeCollocation(collocation.canonical_text);
  if (sha256(normalizedCanonical) !== collocation.normalized_text_hash) {
    errors.push("normalized_text_hash does not match canonical_text");
  }

  const accepted = new Set((collocation.accepted_answers ?? []).map(normalizeCollocation));
  if (!accepted.has(normalizedCanonical)) {
    errors.push("accepted_answers must include canonical_text after normalization");
  }
  if (accepted.size !== (collocation.accepted_answers ?? []).length) {
    errors.push("accepted_answers contains duplicates after normalization");
  }

  const patternSlots = placeholders(collocation.pattern);
  const declaredSlots = new Set((collocation.slots ?? []).map((slot) => slot.name));
  for (const name of patternSlots) {
    if (!declaredSlots.has(name)) errors.push(`collocation pattern placeholder '${name}' has no slot`);
  }
  for (const name of declaredSlots) {
    if (!patternSlots.has(name)) errors.push(`collocation slot '${name}' does not occur in pattern`);
  }

  const sourceKeys = new Set();
  let primaryCount = 0;
  for (const link of collocation.source_links ?? []) {
    if (link.role === "primary") primaryCount += 1;
    const key = `${link.source_essay_id}:${link.paragraph_index}:${link.sentence_index}:${link.surface_form}:${link.occurrence_index}`;
    if (sourceKeys.has(key)) errors.push(`duplicate source link '${key}'`);
    sourceKeys.add(key);

    const source = sourcesById.get(link.source_essay_id);
    if (!source) {
      errors.push(`source link references unknown essay ${link.source_essay_id}`);
    } else {
      const paragraph = source.paragraphs.find(
        (item) => item.paragraph_index === link.paragraph_index
      );
      if (!paragraph) {
        errors.push(`source paragraph ${link.paragraph_index} does not exist in essay ${link.source_essay_id}`);
      } else {
        const sentence = splitSentences(paragraph.text)[link.sentence_index];
        if (!sentence) {
          errors.push(
            `source sentence ${link.paragraph_index}:${link.sentence_index} does not exist in essay ${link.source_essay_id}`
          );
        } else {
          if (sentence !== link.sentence_text) errors.push("source link sentence_text does not match essay location");
          if (!occurrenceExists(sentence, link.surface_form, link.occurrence_index)) {
            errors.push(`surface_form '${link.surface_form}' does not occur in located source sentence`);
          }
        }
      }
    }

    if (link.card_id !== null) {
      const card = cardsById.get(link.card_id);
      if (!card) {
        errors.push(`source link references unknown card ${link.card_id}`);
        continue;
      }
      if (
        card.source_essay_id !== link.source_essay_id ||
        card.paragraph_index !== link.paragraph_index ||
        card.sentence_index !== link.sentence_index ||
        card.original_sentence !== link.sentence_text
      ) {
        errors.push(`card ${link.card_id} does not match the source essay sentence location`);
      }
      if (!occurrenceExists(card.original_sentence, link.surface_form, link.occurrence_index)) {
        errors.push(`surface_form '${link.surface_form}' does not occur in original_sentence for card ${link.card_id}`);
      }
      if (!occurrenceExists(card.learning_sentence, link.learning_surface_form, link.learning_occurrence_index)) {
        errors.push(`learning_surface_form '${link.learning_surface_form}' does not occur in learning_sentence for card ${link.card_id}`);
      }
    } else if (link.learning_surface_form !== null || link.learning_occurrence_index !== null) {
      errors.push("source-only link must not set learning sentence location fields");
    }
  }
  if (primaryCount !== 1) errors.push("collocation must have exactly one primary source link");

  const guidedApplication = collocation.exercise_seed?.guided_application;
  if (collocation.learning_mode === "recall_use" && collocation.workflow_status === "approved" && !guidedApplication) {
    errors.push("Core collocation must include a guided_application Use exercise");
  }
  if (collocation.learning_mode === "appreciation" && guidedApplication) {
    errors.push("Appreciation expression must not include a Use exercise");
  }
  if (guidedApplication && !guidedApplication.reference_answer.toLowerCase().includes(guidedApplication.target_surface.toLowerCase())) {
    errors.push("guided_application target_surface is absent from reference_answer");
  }

  if (
    collocation.workflow_status === "approved" &&
    !(collocation.review_history ?? []).some((event) => event.action === "approved")
  ) {
    errors.push("approved collocation has no approved review event");
  }
  if (collocation.workflow_status === "merged") {
    if (!collocation.deduplication.merge_target_id) errors.push("merged collocation has no merge_target_id");
    if (collocation.deduplication.merge_target_id === collocation.id) errors.push("collocation cannot merge into itself");
  } else if (collocation.deduplication.merge_target_id) {
    errors.push("non-merged collocation must not set merge_target_id");
  }

  return errors;
}

function duplicateCardErrors(cards) {
  const errors = [];
  const seen = new Map();
  for (const card of cards) {
    const existing = seen.get(card.normalized_text_hash);
    if (existing) {
      errors.push(`duplicate normalized_text_hash shared by cards ${existing} and ${card.id}`);
    } else {
      seen.set(card.normalized_text_hash, card.id);
    }
  }
  return errors;
}

function duplicateCollocationErrors(collocations) {
  const errors = [];
  const ids = new Set();
  const hashes = new Map();
  for (const collocation of collocations) {
    if (ids.has(collocation.id)) errors.push(`duplicate collocation id ${collocation.id}`);
    ids.add(collocation.id);
    const existing = hashes.get(collocation.normalized_text_hash);
    if (existing) {
      errors.push(
        `duplicate normalized_text_hash shared by collocations ${existing} and ${collocation.id}`
      );
    } else {
      hashes.set(collocation.normalized_text_hash, collocation.id);
    }
  }
  return errors;
}

function semanticUsePromptErrors(batch, cardsById) {
  const errors = [];
  const seen = new Set();
  for (const item of batch.items) {
    if (seen.has(item.card_id)) errors.push(`duplicate prompt candidate for card ${item.card_id}`);
    seen.add(item.card_id);
    const card = cardsById.get(item.card_id);
    if (!card) {
      errors.push(`prompt candidate references unknown approved card ${item.card_id}`);
      continue;
    }
    const expectedMode = card.primary_focus === "vocabulary" ? "vocabulary" : "structure";
    if (item.mode !== expectedMode) errors.push(`prompt mode does not match card ${item.card_id}`);
    const expectedReference = card.exercise_seed.slot_replacement?.[0]?.reference_answer;
    if (expectedMode === "structure" && item.reference_answer !== expectedReference) {
      errors.push(`reference_answer does not match reviewed card content ${item.card_id}`);
    }
    if (expectedMode === "structure") {
      const expectedPattern = card.exercise_seed.slot_replacement?.[0]?.feedback_pattern;
      if (item.feedback_pattern !== expectedPattern) {
        errors.push(`feedback_pattern does not match reviewed card content ${item.card_id}`);
      } else if (!feedbackPatternMatches(item.feedback_pattern, item.reference_answer)) {
        errors.push(`feedback_pattern fixed text does not match reference_answer for card ${item.card_id}`);
      }
    }
    if (item.target_chunk && !(card.chunks ?? []).some((chunk) => chunk.text === item.target_chunk)) {
      errors.push(`target_chunk is not declared on card ${item.card_id}`);
    }
    if (item.target_chunk && !item.reference_answer.toLowerCase().includes(item.target_chunk.toLowerCase())) {
      errors.push(`target_chunk is absent from reference_answer for card ${item.card_id}`);
    }
    for (const hint of item.hints) {
      if (!item.prompt_zh.includes(hint.zh)) {
        errors.push(`hint label '${hint.zh}' is absent from prompt_zh for card ${item.card_id}`);
      }
      if (!item.reference_answer.toLowerCase().includes(hint.en.toLowerCase())) {
        errors.push(`hint '${hint.en}' is absent from reference_answer for card ${item.card_id}`);
      }
      if (item.target_chunk && hint.en.toLowerCase().includes(item.target_chunk.toLowerCase())) {
        errors.push(`target_chunk must not be exposed as a hint for card ${item.card_id}`);
      }
    }
  }
  return errors;
}

function semanticCollocationUsePromptErrors(batch, collocationsById) {
  const errors = [];
  const seen = new Set();
  const prompts = new Map();
  const answers = new Map();
  for (const item of batch.items) {
    if (seen.has(item.collocation_id)) {
      errors.push(`duplicate Use prompt candidate for collocation ${item.collocation_id}`);
    }
    seen.add(item.collocation_id);
    const collocation = collocationsById.get(item.collocation_id);
    if (!collocation) {
      errors.push(`Use prompt candidate references unknown approved collocation ${item.collocation_id}`);
      continue;
    }
    const promptKey = normalizeSentence(item.prompt_zh);
    const answerKey = normalizeSentence(item.reference_answer);
    if (prompts.has(promptKey)) errors.push(`duplicate Chinese Use prompt shared by ${prompts.get(promptKey)} and ${item.collocation_id}`);
    else prompts.set(promptKey, item.collocation_id);
    if (answers.has(answerKey)) errors.push(`duplicate Use reference answer shared by ${answers.get(answerKey)} and ${item.collocation_id}`);
    else answers.set(answerKey, item.collocation_id);
    if (promptKey === normalizeSentence(collocation.translation_prompt)) {
      errors.push(`Use prompt does not provide a complete changed-context sentence for ${item.collocation_id}`);
    }
    if ((collocation.source_links ?? []).some((link) => normalizeSentence(link.sentence_text) === answerKey)) {
      errors.push(`Use reference answer repeats a source sentence for ${item.collocation_id}`);
    }
    if (item.review_status === "approved" && !item.review_history.some((event) => event.action === "approved")) {
      errors.push(`approved Use prompt has no approved review event for ${item.collocation_id}`);
    }
    if (!item.reference_answer.toLowerCase().includes(item.target_surface.toLowerCase())) {
      errors.push(`target_surface is absent from reference_answer for collocation ${item.collocation_id}`);
    }
    for (const hint of item.hints) {
      if (!item.prompt_zh.includes(hint.zh)) {
        errors.push(`hint label '${hint.zh}' is absent from prompt_zh for collocation ${item.collocation_id}`);
      }
      if (!item.reference_answer.toLowerCase().includes(hint.en.toLowerCase())) {
        errors.push(`hint '${hint.en}' is absent from reference_answer for collocation ${item.collocation_id}`);
      }
      if (hint.en.toLowerCase().includes(item.target_surface.toLowerCase())) {
        errors.push(`target collocation must not be exposed as a hint for ${item.collocation_id}`);
      }
    }
  }
  return errors;
}

function validateOne(schemaId, value, label) {
  const validate = ajv.getSchema(schemaId);
  const valid = validate(value);
  if (!valid) {
    throw new Error(`${label} failed schema validation:\n${formatErrors(validate.errors)}`);
  }
}

function validateFixtures() {
  const cases = readJson("tests/fixtures/content/manifest.json");
  const sources = cases
    .filter((item) => item.schema === "source" && item.expected_valid)
    .map((item) => readJson(`tests/fixtures/content/${item.file}`));
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const validCandidateCards = cases
    .filter((item) => item.schema === "candidate" && item.expected_valid)
    .map((item) => readJson(`tests/fixtures/content/${item.file}`).card);
  const cardsById = new Map(validCandidateCards.map((card) => [card.id, card]));

  for (const item of cases) {
    const value = readJson(`tests/fixtures/content/${item.file}`);
    const validate = ajv.getSchema(schemaIds[item.schema]);
    const schemaValid = validate(value);
    const semanticErrors =
      schemaValid && item.schema === "source"
        ? semanticSourceErrors(value)
        : schemaValid && item.schema === "card"
        ? semanticCardErrors(value)
        : schemaValid && item.schema === "candidate"
          ? semanticCandidateErrors(value, sourcesById)
          : schemaValid && item.schema === "collocation"
            ? semanticCollocationErrors(value, cardsById, sourcesById)
          : [];
    const actualValid = schemaValid && semanticErrors.length === 0;

    if (actualValid !== item.expected_valid) {
      const details = schemaValid ? semanticErrors.join("\n") : formatErrors(validate.errors);
      throw new Error(
        `${item.file}: expected valid=${item.expected_valid}, got valid=${actualValid}\n${details}`
      );
    }
    process.stdout.write(`PASS ${item.file} (expected ${item.expected_valid ? "valid" : "invalid"})\n`);
  }

  const invalidGlossCandidate = structuredClone(
    readJson("tests/fixtures/content/valid-candidate-card.json")
  );
  invalidGlossCandidate.card.glosses[0].text = "word-not-in-the-learning-sentence";
  const glossErrors = semanticCandidateErrors(invalidGlossCandidate, sourcesById);
  if (!glossErrors.some((error) => error.startsWith("gloss '"))) {
    throw new Error("semantic validation failed to reject a gloss missing from learning_sentence");
  }
  process.stdout.write("PASS invalid gloss location (expected invalid)\n");

  const invalidSentenceIndex = structuredClone(
    readJson("tests/fixtures/content/valid-candidate-card.json")
  );
  invalidSentenceIndex.card.sentence_index = 0;
  invalidSentenceIndex.source_match.sentence_index = 0;
  const sentenceErrors = semanticCandidateErrors(invalidSentenceIndex, sourcesById);
  if (!sentenceErrors.includes("sentence_index does not point to original_sentence")) {
    throw new Error("semantic validation failed to reject an incorrect sentence_index");
  }
  process.stdout.write("PASS invalid sentence index (expected invalid)\n");

  const invalidSourceHash = structuredClone(
    readJson("tests/fixtures/content/valid-source-essay.json")
  );
  invalidSourceHash.content_hash = "0".repeat(64);
  const sourceHashErrors = semanticSourceErrors(invalidSourceHash);
  if (!sourceHashErrors.includes("source content_hash does not match full_text")) {
    throw new Error("semantic validation failed to reject an incorrect source hash");
  }
  process.stdout.write("PASS invalid source hash (expected invalid)\n");

  const invalidNormalizedHash = structuredClone(
    readJson("tests/fixtures/content/valid-candidate-card.json")
  );
  invalidNormalizedHash.card.normalized_text_hash = "0".repeat(64);
  const normalizedHashErrors = semanticCandidateErrors(invalidNormalizedHash, sourcesById);
  if (!normalizedHashErrors.includes("normalized_text_hash does not match learning_sentence")) {
    throw new Error("semantic validation failed to reject an incorrect normalized sentence hash");
  }
  process.stdout.write("PASS invalid normalized sentence hash (expected invalid)\n");

  const invalidLearningEdit = structuredClone(
    readJson("tests/fixtures/content/valid-candidate-card.json")
  );
  invalidLearningEdit.card.learning_sentence =
    "Although online courses widen access to education, classroom interaction remains important.";
  invalidLearningEdit.card.learning_edits = [{
    edit_type: "resolve_reference",
    before: "text that is absent",
    after: "Although online courses widen access to education",
    reason: "Synthetic invalid edit for semantic validation."
  }];
  invalidLearningEdit.card.normalized_text_hash = sha256(
    normalizeSentence(invalidLearningEdit.card.learning_sentence)
  );
  invalidLearningEdit.card.exercise_seed.translation_recall.reference_answer =
    invalidLearningEdit.card.learning_sentence;
  const learningEditErrors = semanticCandidateErrors(invalidLearningEdit, sourcesById);
  if (!learningEditErrors.some((error) => error.startsWith("learning edit before text"))) {
    throw new Error("semantic validation failed to reject an untraceable learning edit");
  }
  process.stdout.write("PASS invalid learning edit trace (expected invalid)\n");

  const validCollocation = readJson("tests/fixtures/content/valid-collocation-candidate.json");
  const invalidCollocationHash = structuredClone(validCollocation);
  invalidCollocationHash.normalized_text_hash = "0".repeat(64);
  const collocationHashErrors = semanticCollocationErrors(invalidCollocationHash, cardsById, sourcesById);
  if (!collocationHashErrors.includes("normalized_text_hash does not match canonical_text")) {
    throw new Error("semantic validation failed to reject an incorrect collocation hash");
  }
  process.stdout.write("PASS invalid collocation hash (expected invalid)\n");

  const invalidAcceptedAnswers = structuredClone(validCollocation);
  invalidAcceptedAnswers.accepted_answers = ["expand access to"];
  const acceptedAnswerErrors = semanticCollocationErrors(invalidAcceptedAnswers, cardsById, sourcesById);
  if (!acceptedAnswerErrors.includes("accepted_answers must include canonical_text after normalization")) {
    throw new Error("semantic validation failed to require canonical_text in accepted_answers");
  }
  process.stdout.write("PASS invalid collocation accepted answers (expected invalid)\n");

  const invalidApprovedHistory = structuredClone(validCollocation);
  invalidApprovedHistory.workflow_status = "approved";
  const approvedHistoryErrors = semanticCollocationErrors(invalidApprovedHistory, cardsById, sourcesById);
  if (!approvedHistoryErrors.includes("approved collocation has no approved review event")) {
    throw new Error("semantic validation failed to require an approved collocation review event");
  }
  process.stdout.write("PASS invalid collocation approval history (expected invalid)\n");

  const validSourceOnlyCollocation = readJson(
    "tests/fixtures/content/valid-source-only-collocation.json"
  );
  const invalidSourceOnlyLearningLink = structuredClone(validSourceOnlyCollocation);
  invalidSourceOnlyLearningLink.source_links[0].learning_surface_form =
    "receive immediate feedback from";
  invalidSourceOnlyLearningLink.source_links[0].learning_occurrence_index = 0;
  const validateCollocation = ajv.getSchema(schemaIds.collocation);
  if (validateCollocation(invalidSourceOnlyLearningLink)) {
    throw new Error("schema validation failed to reject learning location without a card link");
  }
  process.stdout.write("PASS invalid source-only learning location (expected invalid)\n");

  const invalidSourceSentenceLocation = structuredClone(validSourceOnlyCollocation);
  invalidSourceSentenceLocation.source_links[0].sentence_index = 1;
  const sourceLocationErrors = semanticCollocationErrors(
    invalidSourceSentenceLocation,
    cardsById,
    sourcesById
  );
  if (!sourceLocationErrors.includes("source link sentence_text does not match essay location")) {
    throw new Error("semantic validation failed to reject an incorrect direct source sentence location");
  }
  process.stdout.write("PASS invalid direct source sentence location (expected invalid)\n");
}

function validateDataFiles() {
  const sources = readJson("data/source_essays.json");
  const candidates = readJson("data/candidate_cards.json");
  const approvedCards = readJson("data/approved_cards.seed.json");
  const candidateCollocations = readJson("data/candidate_collocations.json");
  const approvedCollocations = readJson("data/approved_collocations.seed.json");
  const usePrompts = readJson("data/use_prompt_candidates.json");
  const collocationUsePrompts = readJson("data/collocation_use_prompt_candidates.json");
  const sourcesById = new Map();
  const approvedCardsById = new Map(approvedCards.map((card) => [card.id, card]));
  const approvedCollocationsById = new Map(approvedCollocations.map((item) => [item.id, item]));

  validateOne(schemaIds.usePrompts, usePrompts, "use_prompt_candidates");
  const usePromptErrors = semanticUsePromptErrors(usePrompts, approvedCardsById);
  if (usePromptErrors.length) throw new Error(`use_prompt_candidates:\n${usePromptErrors.join("\n")}`);

  validateOne(schemaIds.collocationUsePrompts, collocationUsePrompts, "collocation_use_prompt_candidates");
  const collocationUsePromptErrors = semanticCollocationUsePromptErrors(
    collocationUsePrompts,
    approvedCollocationsById,
  );
  if (collocationUsePromptErrors.length) {
    throw new Error(`collocation_use_prompt_candidates:\n${collocationUsePromptErrors.join("\n")}`);
  }

  for (const [index, source] of sources.entries()) {
    validateOne(schemaIds.source, source, `source_essays[${index}]`);
    const errors = semanticSourceErrors(source);
    if (errors.length) throw new Error(`source_essays[${index}]:\n${errors.join("\n")}`);
    sourcesById.set(source.id, source);
  }
  for (const [index, candidate] of candidates.entries()) {
    validateOne(schemaIds.candidate, candidate, `candidate_cards[${index}]`);
    const errors = semanticCandidateErrors(candidate, sourcesById);
    if (errors.length) throw new Error(`candidate_cards[${index}]:\n${errors.join("\n")}`);
  }
  for (const [index, card] of approvedCards.entries()) {
    validateOne(schemaIds.card, card, `approved_cards[${index}]`);
    const errors = semanticCardErrors(card);
    if (errors.length) throw new Error(`approved_cards[${index}]:\n${errors.join("\n")}`);
    if (card.content_status !== "approved") {
      throw new Error(`approved_cards[${index}] must have content_status='approved'`);
    }
  }
  for (const [index, collocation] of candidateCollocations.entries()) {
    validateOne(schemaIds.collocation, collocation, `candidate_collocations[${index}]`);
    const errors = semanticCollocationErrors(collocation, approvedCardsById, sourcesById);
    if (errors.length) throw new Error(`candidate_collocations[${index}]:\n${errors.join("\n")}`);
  }
  const candidateCollocationsById = new Map(candidateCollocations.map((item) => [item.id, item]));
  for (const [index, collocation] of approvedCollocations.entries()) {
    validateOne(schemaIds.collocation, collocation, `approved_collocations[${index}]`);
    const errors = semanticCollocationErrors(collocation, approvedCardsById, sourcesById);
    if (errors.length) throw new Error(`approved_collocations[${index}]:\n${errors.join("\n")}`);
    if (collocation.workflow_status !== "approved") {
      throw new Error(`approved_collocations[${index}] must have workflow_status='approved'`);
    }
    const candidate = candidateCollocationsById.get(collocation.id);
    if (!candidate) throw new Error(`approved_collocations[${index}] has no candidate source`);
    if (collocation.content_revision <= candidate.content_revision) {
      throw new Error(`approved_collocations[${index}] must have a newer content_revision than its candidate`);
    }
  }

  const candidateDuplicateErrors = duplicateCardErrors(candidates.map((candidate) => candidate.card));
  if (candidateDuplicateErrors.length) {
    throw new Error(`candidate_cards duplicates:\n${candidateDuplicateErrors.join("\n")}`);
  }
  const approvedDuplicateErrors = duplicateCardErrors(approvedCards);
  if (approvedDuplicateErrors.length) {
    throw new Error(`approved_cards duplicates:\n${approvedDuplicateErrors.join("\n")}`);
  }
  const collocationDuplicateErrors = duplicateCollocationErrors(candidateCollocations);
  if (collocationDuplicateErrors.length) {
    throw new Error(`candidate_collocations duplicates:\n${collocationDuplicateErrors.join("\n")}`);
  }
  const approvedCollocationDuplicateErrors = duplicateCollocationErrors(approvedCollocations);
  if (approvedCollocationDuplicateErrors.length) {
    throw new Error(`approved_collocations duplicates:\n${approvedCollocationDuplicateErrors.join("\n")}`);
  }

  process.stdout.write(
    `PASS data files (${sources.length} sources, ${candidates.length} sentence candidates, ${approvedCards.length} approved cards, ${candidateCollocations.length} collocation candidates, ${approvedCollocations.length} approved collocations, ${usePrompts.items.length} sentence Use prompt candidates, ${collocationUsePrompts.items.length} collocation Use prompt candidates)\n`
  );
}

if (process.argv.includes("--fixtures")) validateFixtures();
else validateDataFiles();
