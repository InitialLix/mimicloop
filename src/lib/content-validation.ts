import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import commonSchema from "../../schemas/common.schema.json";
import sentenceCardSchema from "../../schemas/sentence-card.schema.json";
import candidateCardSchema from "../../schemas/candidate-card.schema.json";
import collocationSchema from "../../schemas/collocation.schema.json";
import type { CandidateData, CollocationData } from "./content-types";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(commonSchema);
ajv.addSchema(sentenceCardSchema);
ajv.addSchema(candidateCardSchema);
ajv.addSchema(collocationSchema);
const validateCandidate = ajv.getSchema("https://mimicloop.local/schemas/candidate-card.schema.json");
const validateCollocation = ajv.getSchema("https://mimicloop.local/schemas/collocation.schema.json");

const normalizeSentence = (text: string) => text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const hashSentence = (text: string) => createHash("sha256").update(normalizeSentence(text)).digest("hex");
const normalizeCollocation = (text: string) => text
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[.!?,;:]+$/g, "")
  .replace(/\s+/g, " ")
  .trim();
const hashCollocation = (text: string) => createHash("sha256").update(normalizeCollocation(text)).digest("hex");
const placeholders = (pattern: string | null) =>
  new Set([...(pattern ?? "").matchAll(/\{([a-z][a-z0-9_]*)\}/g)].map((match) => match[1]));

export function candidateValidationErrors(candidate: CandidateData): string[] {
  if (!validateCandidate) return ["候选 Schema 未加载。"];
  const errors: string[] = [];
  if (!validateCandidate(candidate)) {
    for (const error of validateCandidate.errors ?? []) {
      const location = error.instancePath || "/";
      errors.push(`${location} ${error.message ?? "格式错误"}`);
    }
    return errors;
  }

  const card = candidate.card;
  if (candidate.workflow_status !== card.content_status) errors.push("候选状态与卡片状态不一致。");
  if (candidate.source_match.matched_text !== card.original_sentence) errors.push("原句与来源匹配记录不一致。");
  if (hashSentence(card.learning_sentence) !== card.normalized_text_hash) errors.push("学习句 hash 不一致。");
  for (const chunk of card.chunks) {
    if (!card.learning_sentence.includes(chunk.text)) errors.push(`词块“${chunk.text}”不在学习句中。`);
  }
  const patternSlots = placeholders(card.pattern);
  const declaredSlots = new Set(card.slots.map((slot) => slot.name));
  for (const name of patternSlots) if (!declaredSlots.has(name)) errors.push(`骨架槽位 {${name}} 没有对应定义。`);
  for (const name of declaredSlots) if (!patternSlots.has(name)) errors.push(`槽位 ${name} 没有出现在骨架中。`);
  for (const exercise of card.exercise_seed.chunk_cloze ?? []) {
    if (exercise.chunk_text !== exercise.reference_answer) errors.push(`词块填空“${exercise.chunk_text}”的答案不一致。`);
    if (!card.chunks.some((chunk) => chunk.text === exercise.chunk_text)) errors.push(`词块填空目标“${exercise.chunk_text}”未声明。`);
  }
  for (const exercise of card.exercise_seed.slot_replacement ?? []) {
    for (const value of exercise.slot_values) {
      if (!declaredSlots.has(value.slot_name)) errors.push(`替换题使用了未声明槽位 ${value.slot_name}。`);
    }
  }
  if (candidate.workflow_status === "approved" && !candidate.review_history.some((item) => item.action === "approved")) {
    errors.push("批准候选缺少批准审核记录。");
  }
  return errors;
}

export function collocationValidationErrors(collocation: CollocationData): string[] {
  if (!validateCollocation) return ["搭配 Schema 未加载。"];
  const errors: string[] = [];
  if (!validateCollocation(collocation)) {
    for (const error of validateCollocation.errors ?? []) {
      const location = error.instancePath || "/";
      errors.push(`${location} ${error.message ?? "格式错误"}`);
    }
    return errors;
  }

  const normalizedCanonical = normalizeCollocation(collocation.canonical_text);
  if (hashCollocation(collocation.canonical_text) !== collocation.normalized_text_hash) {
    errors.push("搭配规范化 hash 与当前英文不一致。");
  }
  const accepted = collocation.accepted_answers.map(normalizeCollocation);
  if (!accepted.includes(normalizedCanonical)) errors.push("可接受答案必须包含当前标准搭配。");
  if (new Set(accepted).size !== accepted.length) errors.push("可接受答案规范化后存在重复项。");

  const patternSlots = placeholders(collocation.pattern);
  const declaredSlots = new Set(collocation.slots.map((slot) => slot.name));
  for (const name of patternSlots) if (!declaredSlots.has(name)) errors.push(`骨架槽位 {${name}} 没有对应定义。`);
  for (const name of declaredSlots) if (!patternSlots.has(name)) errors.push(`槽位 ${name} 没有出现在骨架中。`);

  const sourceKeys = new Set<string>();
  let primaryCount = 0;
  for (const link of collocation.source_links) {
    if (link.role === "primary") primaryCount += 1;
    const key = `${link.source_essay_id}:${link.paragraph_index}:${link.sentence_index}:${link.surface_form}:${link.occurrence_index}`;
    if (sourceKeys.has(key)) errors.push(`来源定位重复：${key}`);
    sourceKeys.add(key);
    if (link.card_id === null && (link.learning_surface_form !== null || link.learning_occurrence_index !== null)) {
      errors.push("没有句子卡关联的来源不能填写学习句定位。");
    }
  }
  if (primaryCount !== 1) errors.push("每条搭配必须且只能有一个主要来源。");
  const guidedApplication = collocation.exercise_seed.guided_application;
  if (collocation.learning_mode === "recall_use" && collocation.workflow_status === "approved" && !guidedApplication) {
    errors.push("Core 搭配必须包含经过审核的 Use 练习。");
  }
  if (collocation.learning_mode === "appreciation" && guidedApplication) {
    errors.push("Appreciation 表达不能进入 Use 练习。");
  }
  if (guidedApplication && !guidedApplication.reference_answer.toLocaleLowerCase("en").includes(guidedApplication.target_surface.toLocaleLowerCase("en"))) {
    errors.push("Use 参考答案没有包含目标表达。");
  }
  if (collocation.workflow_status === "approved" && !collocation.review_history.some((item) => item.action === "approved")) {
    errors.push("批准搭配缺少批准审核记录。");
  }
  if (collocation.workflow_status === "merged") {
    if (!collocation.deduplication.merge_target_id) errors.push("合并搭配缺少目标 ID。");
    if (collocation.deduplication.merge_target_id === collocation.id) errors.push("搭配不能合并到自身。");
  } else if (collocation.deduplication.merge_target_id) {
    errors.push("非合并状态不能保留合并目标。");
  }
  return errors;
}
