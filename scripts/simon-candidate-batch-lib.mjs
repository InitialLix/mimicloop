import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data/source_essays.json");
const candidatePath = path.join(root, "data/candidate_cards.json");
const approvedPath = path.join(root, "data/approved_cards.seed.json");

export const chunk = (text, meaning_zh, note = "") => ({ text, meaning_zh, note });
export const gloss = (text, lemma, part_of_speech, meaning_zh, note = "") => ({
  text,
  lemma,
  part_of_speech,
  meaning_zh,
  note,
  occurrence_index: 0,
});
export const slot = (name, role_zh, original_value, replacement) => ({
  name,
  role_zh,
  original_value,
  replacement_examples: [replacement],
});
export const hint = (zh, en) => ({ zh, en });

function sentenceList(paragraph) {
  return (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function uuidFrom(seed) {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizedHash(sentence) {
  const normalized = sentence.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function makeCandidate(spec, config, sourceByEssay) {
  const source = sourceByEssay.get(spec.essay);
  if (!source) throw new Error(`Unknown Simon essay ${spec.essay}`);
  const paragraph = source.paragraphs.find((item) => item.paragraph_index === spec.paragraph);
  if (!paragraph) throw new Error(`${spec.key}: missing paragraph ${spec.paragraph}`);
  const sentences = sentenceList(paragraph.text);
  const original = sentences[spec.sentence];
  if (!original) throw new Error(`${spec.key}: missing sentence ${spec.sentence}`);
  const learning = spec.learningSentence ?? original;
  const chunks = spec.chunks ?? [];
  const glosses = spec.glosses ?? [];

  for (const item of [...chunks, ...glosses]) {
    if (!learning.includes(item.text)) throw new Error(`${spec.key}: '${item.text}' is not in the learning sentence`);
  }
  if (spec.focus === "vocabulary" && chunks.length !== 1) {
    throw new Error(`${spec.key}: vocabulary cards require exactly one target chunk`);
  }
  if (spec.focus !== "vocabulary" && (!spec.pattern || spec.slots.length === 0)) {
    throw new Error(`${spec.key}: structure and mixed cards require a pattern and slots`);
  }
  if (!spec.usePrompt.trim() || !spec.transfer.trim()) {
    throw new Error(`${spec.key}: Use prompt and reference answer are required`);
  }

  const cardId = uuidFrom(`card:${config.promptVersion}:${spec.key}`);
  const candidateId = uuidFrom(`candidate:${config.promptVersion}:${spec.key}`);
  const contentRevision = config.contentRevision ?? 1;
  const approved = Boolean(config.approvedAt);
  const updatedAt = config.approvedAt ?? config.revisedAt ?? config.createdAt;
  const chunkCloze = chunks.length
    ? [{
        chunk_text: chunks[0].text,
        prompt_sentence: learning.replace(chunks[0].text, "_____"),
        reference_answer: chunks[0].text,
      }]
    : undefined;
  const slotReplacement = spec.focus !== "vocabulary"
    ? [{
        prompt_zh: spec.usePrompt,
        hints: spec.hints,
        slot_values: spec.slots.map((item) => ({
          slot_name: item.name,
          value: item.replacement_examples[0],
        })),
        reference_answer: spec.transfer,
      }]
    : undefined;
  const guidedApplication = spec.focus === "vocabulary"
    ? {
        prompt_zh: spec.usePrompt,
        hints: spec.hints,
        target_chunk: chunks[0].text,
        reference_answer: spec.transfer,
      }
    : undefined;

  return {
    schema_version: "1.0.0",
    candidate_id: candidateId,
    card: {
      schema_version: "1.0.0",
      id: cardId,
      source_essay_id: source.id,
      original_sentence: original,
      learning_sentence: learning,
      learning_edits: spec.learningEdits ?? [],
      translation_zh: spec.translation,
      context_before: sentences[spec.sentence - 1] ?? "",
      context_after: sentences[spec.sentence + 1] ?? "",
      paragraph_index: spec.paragraph,
      sentence_index: spec.sentence,
      task: "academic_task_2",
      question_types: [source.question_type],
      topics: source.topics,
      argument_functions: spec.functions,
      primary_focus: spec.focus,
      chunks,
      glosses,
      pattern: spec.pattern,
      slots: spec.slots,
      grammar_note: spec.grammar,
      usage_note: spec.usage,
      simplified_version: spec.simplified,
      transfer_example: spec.transfer,
      exercise_seed: {
        ...(chunkCloze ? { chunk_cloze: chunkCloze } : {}),
        translation_recall: { prompt_zh: spec.translation, reference_answer: learning },
        ...(slotReplacement ? { slot_replacement: slotReplacement } : {}),
        ...(guidedApplication ? { guided_application: guidedApplication } : {}),
      },
      difficulty: spec.difficulty,
      transfer_value: spec.transferValue,
      source_reliability: "teacher_authored",
      content_status: approved ? "approved" : "candidate",
      content_revision: contentRevision,
      normalized_text_hash: normalizedHash(learning),
      created_at: config.createdAt,
      updated_at: updatedAt,
    },
    source_match: {
      match_type: "exact",
      matched_text: original,
      paragraph_index: spec.paragraph,
      sentence_index: spec.sentence,
    },
    selection_scores: {
      naturalness: spec.scores[0],
      context_independence: spec.scores[1],
      vocabulary_value: spec.scores[2],
      structure_value: spec.scores[3],
      transfer_value: spec.scores[4],
    },
    recommendation_reasons: spec.reasons,
    uncertainties: ["合集未提供 Simon 一手文章 URL 或 IELTS 考官评语；作者归属与合集 Band 标签不能视为官方认证。"],
    workflow_status: approved ? "approved" : "candidate",
    priority: spec.priority,
    provenance: {
      guideline_version: "1.0.0",
      prompt_version: config.promptVersion,
      processor_type: "codex",
      model_id: null,
    },
    review_history: [{
      action: "created",
      reviewer: "Codex",
      reason: `${config.batchLabel}按已确认的校准标准生成，等待批次人工确认；尚未进入正式学习库。`,
      reviewed_at: config.createdAt,
    }, ...(config.revisedAt ? [{
      action: "edited",
      reviewer: "Codex",
      reason: config.revisionReason ?? "批次自检后修正练习表达与提示。",
      reviewed_at: config.revisedAt,
    }] : []), ...(config.approvedAt ? [{
      action: "approved",
      reviewer: "user",
      reason: config.approvalReason ?? "用户确认该批次可以整批收录。",
      reviewed_at: config.approvedAt,
    }] : [])],
    created_at: config.createdAt,
    updated_at: updatedAt,
  };
}

export function generateSimonCandidateBatch(config, specs) {
  const sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const existingCandidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  const existingApprovedCards = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
  const sourceByEssay = new Map(
    sources.map((source) => [Number(source.publication_ref.match(/^Essay (\d+),/)?.[1]), source]),
  );
  const generated = specs.map((spec) => makeCandidate(spec, config, sourceByEssay));
  const retained = existingCandidates.filter(
    (candidate) => candidate.provenance?.prompt_version !== config.promptVersion,
  );
  const merged = [...retained, ...generated];
  const hashes = new Map();
  for (const candidate of merged) {
    const hash = candidate.card.normalized_text_hash;
    if (hashes.has(hash)) throw new Error(`Duplicate learning sentence: ${candidate.card.learning_sentence}`);
    hashes.set(hash, candidate.candidate_id);
  }
  fs.writeFileSync(candidatePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  const existingApprovedById = new Map(existingApprovedCards.map((card) => [card.id, card]));
  const approvedCards = merged
    .filter((candidate) => candidate.workflow_status === "approved")
    .map((candidate) => {
      const existing = existingApprovedById.get(candidate.card.id);
      return existing && existing.content_revision >= candidate.card.content_revision
        ? existing
        : candidate.card;
    });
  fs.writeFileSync(approvedPath, `${JSON.stringify(approvedCards, null, 2)}\n`, "utf8");

  const byEssay = new Map();
  const byFocus = new Map();
  for (const candidate of generated) {
    const source = sources.find((item) => item.id === candidate.card.source_essay_id);
    byEssay.set(source.title, (byEssay.get(source.title) ?? 0) + 1);
    byFocus.set(candidate.card.primary_focus, (byFocus.get(candidate.card.primary_focus) ?? 0) + 1);
  }
  const lines = [
    `# ${config.batchLabel}候选`,
    "",
    `- 生成时间：${config.createdAt}`,
    `- 批次版本：\`${config.promptVersion}\``,
    ...(config.approvedAt
      ? [`- 批准收录：${generated.length} 张，用户于 ${config.approvedAt} 完成批次确认`]
      : [`- 新增候选：${generated.length} 张，全部保持 \`candidate\`，未进入正式学习库`]),
    `- 类型分布：${[...byFocus].map(([focus, count]) => `${focus} ${count}`).join("；")}`,
    `- 篇目分布：${[...byEssay].map(([title, count]) => `${title} ${count}`).join("；")}`,
    "- 筛选原则：不按篇凑数；排除机械开头、基础透明表达和与现有卡高度重复的结构。",
    "",
  ];
  generated.forEach((candidate, index) => {
    const card = candidate.card;
    const source = sources.find((item) => item.id === card.source_essay_id);
    const useSeed = card.primary_focus === "vocabulary"
      ? card.exercise_seed.guided_application
      : card.exercise_seed.slot_replacement[0];
    lines.push(
      `## ${index + 1}. ${source.title}`,
      "",
      `- 原句：${card.original_sentence}`,
      ...(card.learning_sentence !== card.original_sentence ? [`- 学习句：${card.learning_sentence}`] : []),
      `- 位置：${source.publication_ref}，段落 ${card.paragraph_index + 1}，句子 ${card.sentence_index + 1}`,
      `- 中文：${card.translation_zh}`,
      `- 训练重点：${card.primary_focus}`,
      `- 核心词块：${card.chunks.map((item) => item.text).join("；") || "无"}`,
      `- 仿写中文：${useSeed.prompt_zh}`,
      `- 参考答案：${useSeed.reference_answer}`,
      `- 推荐理由：${candidate.recommendation_reasons.join("；")}`,
      `- 优先级：${candidate.priority}`,
      "",
    );
  });
  fs.writeFileSync(config.reviewPath, `${lines.join("\n")}\n`, "utf8");
  process.stdout.write(
    `Generated ${generated.length} ${config.batchLabel} candidates; total candidates ${merged.length}. `
    + `Focus: ${[...byFocus].map(([focus, count]) => `${focus}=${count}`).join(", ")}.\n`,
  );
}
