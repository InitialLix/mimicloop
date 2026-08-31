import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SqliteConnection } from "./client";
import { sha256, stableJson, type JsonObject } from "./json";

export interface SeedBundle {
  sources: JsonObject[];
  candidates: JsonObject[];
  approvedCards: JsonObject[];
}

export interface ImportResult {
  importHash: string;
  alreadyImported: boolean;
  sources: number;
  candidates: number;
  approvedCards: number;
}

export interface CollocationImportResult {
  importHash: string;
  alreadyImported: boolean;
  candidates: number;
  approved: number;
  relations: number;
}

function requiredString(record: JsonObject, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing string field: ${field}`);
  return value;
}

function requiredNumber(record: JsonObject, field: string): number {
  const value = record[field];
  if (typeof value !== "number") throw new Error(`Missing number field: ${field}`);
  return value;
}

function objectField(record: JsonObject, field: string): JsonObject {
  const value = record[field];
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`Missing object field: ${field}`);
  return value as JsonObject;
}

function stringArray(record: JsonObject, field: string): string[] {
  const value = record[field];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Missing string array field: ${field}`);
  }
  return value as string[];
}

function objectArray(record: JsonObject, field: string): JsonObject[] {
  const value = record[field];
  if (!Array.isArray(value) || value.some((item) => item === null || typeof item !== "object" || Array.isArray(item))) {
    throw new Error(`Missing object array field: ${field}`);
  }
  return value as JsonObject[];
}

function nullableString(record: JsonObject, field: string): string | null {
  const value = record[field];
  if (value !== null && typeof value !== "string") throw new Error(`Invalid nullable string field: ${field}`);
  return value as string | null;
}

function nullableNumber(record: JsonObject, field: string): number | null {
  const value = record[field];
  if (value !== null && typeof value !== "number") throw new Error(`Invalid nullable number field: ${field}`);
  return value as number | null;
}

function splitSentences(paragraph: string): string[] {
  return (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function occurrenceOffset(text: string, needle: string, occurrenceIndex: number): number {
  let cursor = 0;
  for (let index = 0; index <= occurrenceIndex; index += 1) {
    const found = text.indexOf(needle, cursor);
    if (found < 0) return -1;
    if (index === occurrenceIndex) return found;
    cursor = found + needle.length;
  }
  return -1;
}

export async function loadSeedBundle(projectRoot = process.cwd()): Promise<SeedBundle> {
  const readJsonArray = async (filename: string) => {
    const parsed: unknown = JSON.parse(await readFile(path.join(projectRoot, filename), "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${filename} must contain an array`);
    return parsed as JsonObject[];
  };

  return {
    sources: await readJsonArray("data/source_essays.json"),
    candidates: await readJsonArray("data/candidate_cards.json"),
    approvedCards: await readJsonArray("data/approved_cards.seed.json"),
  };
}

export async function loadCollocationCandidateSeed(projectRoot = process.cwd()): Promise<JsonObject[]> {
  const filename = "data/candidate_collocations.json";
  const parsed: unknown = JSON.parse(await readFile(path.join(projectRoot, filename), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${filename} must contain an array`);
  return parsed as JsonObject[];
}

export async function loadApprovedCollocationSeed(projectRoot = process.cwd()): Promise<JsonObject[]> {
  const filename = "data/approved_collocations.seed.json";
  const parsed: unknown = JSON.parse(await readFile(path.join(projectRoot, filename), "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${filename} must contain an array`);
  return parsed as JsonObject[];
}

export class ContentRepository {
  constructor(private readonly connection: SqliteConnection) {}

  importSeeds(bundle: SeedBundle, importedAt = new Date().toISOString()): ImportResult {
    const importHash = sha256(bundle);
    const alreadyImported = this.connection.sqlite
      .prepare("SELECT 1 FROM content_imports WHERE import_hash = ?")
      .get(importHash);

    if (alreadyImported) {
      return {
        importHash,
        alreadyImported: true,
        sources: bundle.sources.length,
        candidates: bundle.candidates.length,
        approvedCards: bundle.approvedCards.length,
      };
    }

    this.connection.sqlite.transaction(() => {
      for (const source of bundle.sources) this.insertSource(source);
      for (const candidate of bundle.candidates) this.insertCandidate(candidate);
      for (const card of bundle.approvedCards) this.insertApprovedCard(card);

      this.connection.sqlite
        .prepare(
          `INSERT INTO settings (key, value_json, updated_at)
           VALUES ('daily_new_card_limit', ?, ?)
           ON CONFLICT(key) DO NOTHING`,
        )
        .run(JSON.stringify(5), importedAt);

      this.connection.sqlite
        .prepare(
          `INSERT INTO content_imports
           (import_hash, source_count, candidate_count, approved_card_count, imported_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(importHash, bundle.sources.length, bundle.candidates.length, bundle.approvedCards.length, importedAt);
    })();

    return {
      importHash,
      alreadyImported: false,
      sources: bundle.sources.length,
      candidates: bundle.candidates.length,
      approvedCards: bundle.approvedCards.length,
    };
  }

  importCollocationCandidates(candidates: JsonObject[], importedAt = new Date().toISOString()): CollocationImportResult {
    const importHash = sha256(candidates);
    const relationCount = candidates.reduce((total, candidate) => total + objectArray(candidate, "source_links").length, 0);
    const alreadyImported = this.connection.sqlite
      .prepare("SELECT 1 FROM collocation_imports WHERE import_hash = ?")
      .get(importHash);

    if (alreadyImported) {
      return {
        importHash,
        alreadyImported: true,
        candidates: candidates.length,
        approved: 0,
        relations: relationCount,
      };
    }

    for (const candidate of candidates) {
      if (requiredString(candidate, "workflow_status") !== "candidate") {
        throw new Error("Collocation seed import only accepts candidate workflow items");
      }
    }

    this.connection.sqlite.transaction(() => {
      for (const candidate of candidates) this.insertCollocationCandidate(candidate, false);
      this.connection.sqlite
        .prepare(
          `INSERT INTO collocation_imports
           (import_hash, candidate_count, approved_count, relation_count, imported_at)
           VALUES (?, ?, 0, ?, ?)`,
        )
        .run(importHash, candidates.length, relationCount, importedAt);
    })();

    return {
      importHash,
      alreadyImported: false,
      candidates: candidates.length,
      approved: 0,
      relations: relationCount,
    };
  }

  importApprovedCollocations(collocations: JsonObject[], importedAt = new Date().toISOString()): CollocationImportResult {
    const importHash = sha256(collocations);
    const relationCount = collocations.reduce((total, item) => total + objectArray(item, "source_links").length, 0);
    const alreadyImported = this.connection.sqlite
      .prepare("SELECT 1 FROM collocation_imports WHERE import_hash = ?")
      .get(importHash);
    if (alreadyImported) {
      return {
        importHash,
        alreadyImported: true,
        candidates: 0,
        approved: collocations.length,
        relations: relationCount,
      };
    }
    for (const collocation of collocations) {
      if (requiredString(collocation, "workflow_status") !== "approved") {
        throw new Error("Approved collocation seed only accepts approved workflow items");
      }
    }

    this.connection.sqlite.transaction(() => {
      for (const collocation of collocations) {
        this.insertCollocationCandidate(collocation, true);
        const current = this.getCollocationCandidate(requiredString(collocation, "id"));
        if (current && requiredString(current, "workflow_status") === "approved") {
          this.insertApprovedCollocation(current);
        }
      }
      this.connection.sqlite
        .prepare(
          `INSERT INTO collocation_imports
           (import_hash, candidate_count, approved_count, relation_count, imported_at)
           VALUES (?, 0, ?, ?, ?)`,
        )
        .run(importHash, collocations.length, relationCount, importedAt);
    })();

    return {
      importHash,
      alreadyImported: false,
      candidates: 0,
      approved: collocations.length,
      relations: relationCount,
    };
  }

  restoreCollocationCandidates(candidates: JsonObject[]) {
    this.connection.sqlite.transaction(() => {
      for (const candidate of candidates) this.insertCollocationCandidate(candidate, true);
    })();
  }

  getCounts() {
    const count = (table: string) => {
      const row = this.connection.sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
      return row.count;
    };
    return {
      sources: count("source_essays"),
      candidates: count("candidates"),
      cards: count("cards"),
      attempts: count("attempts"),
      reviewStates: count("review_states"),
      collocationCandidates: count("collocation_candidates"),
      collocations: count("collocations"),
      collocationSourceLinks: count("collocation_source_links"),
      collocationAttempts: count("collocation_attempts"),
      collocationProgress: count("collocation_progress"),
    };
  }

  listSources(): JsonObject[] {
    return this.readRawJson("source_essays", "id");
  }

  saveGuidedWritingPrompt(prompt: JsonObject) {
    this.insertSource(prompt);
    return prompt;
  }

  listCandidates(): JsonObject[] {
    return this.readRawJson("candidates", "candidate_id");
  }

  getCandidate(candidateId: string): JsonObject | null {
    const row = this.connection.sqlite
      .prepare("SELECT raw_json AS rawJson FROM candidates WHERE candidate_id = ?")
      .get(candidateId) as { rawJson: string } | undefined;
    return row ? JSON.parse(row.rawJson) as JsonObject : null;
  }

  saveReviewedCandidate(candidate: JsonObject, publish: boolean) {
    const candidateId = requiredString(candidate, "candidate_id");
    const card = objectField(candidate, "card");
    const rawJson = stableJson(candidate);
    this.connection.sqlite.transaction(() => {
      const result = this.connection.sqlite
        .prepare(
          `UPDATE candidates SET card_id = ?, source_essay_id = ?, workflow_status = ?, priority = ?,
           normalized_text_hash = ?, raw_json = ?, updated_at = ? WHERE candidate_id = ?`,
        )
        .run(
          requiredString(card, "id"),
          requiredString(card, "source_essay_id"),
          requiredString(candidate, "workflow_status"),
          requiredString(candidate, "priority"),
          requiredString(card, "normalized_text_hash"),
          rawJson,
          requiredString(candidate, "updated_at"),
          candidateId,
        );
      if (result.changes !== 1) throw new Error(`Unknown candidate: ${candidateId}`);
      if (publish) this.insertApprovedCard(card);
    })();
  }

  listCards(): JsonObject[] {
    return this.readRawJson("cards", "id");
  }

  listCollocationCandidates(): JsonObject[] {
    return this.readRawJson("collocation_candidates", "created_at, id");
  }

  getCollocationCandidate(id: string): JsonObject | null {
    const row = this.connection.sqlite
      .prepare("SELECT raw_json AS rawJson FROM collocation_candidates WHERE id = ?")
      .get(id) as { rawJson: string } | undefined;
    return row ? JSON.parse(row.rawJson) as JsonObject : null;
  }

  listCollocations(): JsonObject[] {
    return this.readRawJson("collocations", "canonical_text, id");
  }

  restoreCollocations(collocations: JsonObject[]) {
    this.connection.sqlite.transaction(() => {
      for (const collocation of collocations) this.insertApprovedCollocation(collocation);
    })();
  }

  saveReviewedCollocationCandidate(candidate: JsonObject, publish: boolean) {
    const id = requiredString(candidate, "id");
    const rawJson = stableJson(candidate);
    this.connection.sqlite.transaction(() => {
      const current = this.connection.sqlite
        .prepare("SELECT raw_json AS rawJson FROM collocation_candidates WHERE id = ?")
        .get(id) as { rawJson: string } | undefined;
      if (!current) throw new Error(`Unknown collocation candidate: ${id}`);
      const currentRevision = requiredNumber(JSON.parse(current.rawJson) as JsonObject, "content_revision");
      if (requiredNumber(candidate, "content_revision") !== currentRevision + 1) {
        throw new Error("Collocation candidate revision conflict");
      }

      const status = requiredString(candidate, "workflow_status");
      if (status === "merged") {
        const deduplication = objectField(candidate, "deduplication");
        const targetId = nullableString(deduplication, "merge_target_id");
        const target = targetId
          ? this.connection.sqlite.prepare("SELECT 1 FROM collocations WHERE id = ?").get(targetId)
          : null;
        if (!target) throw new Error("合并目标必须是已批准的正式搭配。");
      }

      const result = this.connection.sqlite
        .prepare(
          `UPDATE collocation_candidates SET workflow_status = ?, learning_mode = ?, priority = ?, normalized_text_hash = ?,
           dedup_group_key = ?, raw_json = ?, updated_at = ? WHERE id = ?`,
        )
        .run(
          status,
          requiredString(candidate, "learning_mode"),
          requiredString(candidate, "priority"),
          requiredString(candidate, "normalized_text_hash"),
          requiredString(objectField(candidate, "deduplication"), "group_key"),
          rawJson,
          requiredString(candidate, "updated_at"),
          id,
        );
      if (result.changes !== 1) throw new Error(`Unknown collocation candidate: ${id}`);
      if (publish) this.insertApprovedCollocation(candidate);
    })();
  }

  private readRawJson(table: string, orderColumn: string): JsonObject[] {
    const rows = this.connection.sqlite
      .prepare(`SELECT raw_json AS rawJson FROM ${table} ORDER BY ${orderColumn}`)
      .all() as Array<{ rawJson: string }>;
    return rows.map(({ rawJson }) => JSON.parse(rawJson) as JsonObject);
  }

  private insertCollocationCandidate(candidate: JsonObject, allowReviewed: boolean) {
    const id = requiredString(candidate, "id");
    const deduplication = objectField(candidate, "deduplication");
    const rawJson = stableJson(candidate);
    const values = [
      requiredString(candidate, "workflow_status"),
      requiredString(candidate, "learning_mode"),
      requiredString(candidate, "priority"),
      requiredString(candidate, "normalized_text_hash"),
      requiredString(deduplication, "group_key"),
      rawJson,
      requiredString(candidate, "created_at"),
      requiredString(candidate, "updated_at"),
    ] as const;
    const existing = this.connection.sqlite
      .prepare("SELECT workflow_status AS workflowStatus, raw_json AS rawJson FROM collocation_candidates WHERE id = ?")
      .get(id) as { workflowStatus: string; rawJson: string } | undefined;
    if (existing) {
      if (stableJson(JSON.parse(existing.rawJson)) === rawJson) return;
      if (!allowReviewed && existing.workflowStatus !== "candidate") return;
      const existingRevision = requiredNumber(JSON.parse(existing.rawJson) as JsonObject, "content_revision");
      const incomingRevision = requiredNumber(candidate, "content_revision");
      if (allowReviewed && incomingRevision < existingRevision) return;
      if (allowReviewed && incomingRevision === existingRevision) {
        throw new Error(`Import conflict: collocation_candidates.id=${id} changed at the same content revision`);
      }
      if (!allowReviewed && incomingRevision <= existingRevision) {
        throw new Error(`Import conflict: collocation_candidates.id=${id} changed without a newer content revision`);
      }
      this.connection.sqlite
        .prepare(
          `UPDATE collocation_candidates SET workflow_status = ?, learning_mode = ?, priority = ?, normalized_text_hash = ?,
           dedup_group_key = ?, raw_json = ?, created_at = ?, updated_at = ? WHERE id = ?`,
        )
        .run(...values, id);
      return;
    }
    this.connection.sqlite
      .prepare(
        `INSERT INTO collocation_candidates
         (id, workflow_status, learning_mode, priority, normalized_text_hash, dedup_group_key, raw_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, ...values);
  }

  private insertApprovedCollocation(collocation: JsonObject) {
    if (requiredString(collocation, "workflow_status") !== "approved") {
      throw new Error(`Only approved collocations may be published: ${requiredString(collocation, "id")}`);
    }
    this.validateCollocationSourceLinks(collocation);

    const id = requiredString(collocation, "id");
    const rawJson = stableJson(collocation);
    const values = [
      requiredString(collocation, "canonical_text"),
      requiredString(collocation, "translation_prompt"),
      nullableString(collocation, "pattern"),
      requiredString(collocation, "expression_type"),
      requiredString(collocation, "learning_mode"),
      requiredNumber(collocation, "difficulty"),
      "approved",
      requiredNumber(collocation, "content_revision"),
      requiredString(collocation, "normalized_text_hash"),
      rawJson,
      requiredString(collocation, "created_at"),
      requiredString(collocation, "updated_at"),
    ] as const;
    const existing = this.connection.sqlite
      .prepare("SELECT raw_json AS rawJson, content_revision AS contentRevision FROM collocations WHERE id = ?")
      .get(id) as { rawJson: string; contentRevision: number } | undefined;
    if (existing) {
      if (stableJson(JSON.parse(existing.rawJson)) === rawJson) return;
      if (requiredNumber(collocation, "content_revision") <= existing.contentRevision) {
        throw new Error(`Import conflict: collocations.id=${id} changed without a newer content revision`);
      }
      this.connection.sqlite
        .prepare(
          `UPDATE collocations SET canonical_text = ?, translation_prompt = ?, pattern = ?, expression_type = ?,
           learning_mode = ?, difficulty = ?, content_status = ?, content_revision = ?, normalized_text_hash = ?, raw_json = ?,
           created_at = ?, updated_at = ? WHERE id = ?`,
        )
        .run(...values, id);
      this.connection.sqlite.prepare("DELETE FROM collocation_topics WHERE collocation_id = ?").run(id);
      this.connection.sqlite.prepare("DELETE FROM collocation_argument_functions WHERE collocation_id = ?").run(id);
      this.connection.sqlite.prepare("DELETE FROM collocation_source_links WHERE collocation_id = ?").run(id);
    } else {
      this.connection.sqlite
        .prepare(
          `INSERT INTO collocations
           (id, canonical_text, translation_prompt, pattern, expression_type, learning_mode, difficulty, content_status,
            content_revision, normalized_text_hash, raw_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, ...values);
    }

    const topicStatement = this.connection.sqlite.prepare(
      "INSERT INTO collocation_topics (collocation_id, topic) VALUES (?, ?)",
    );
    for (const topic of stringArray(collocation, "topics")) topicStatement.run(id, topic);
    const functionStatement = this.connection.sqlite.prepare(
      "INSERT INTO collocation_argument_functions (collocation_id, argument_function) VALUES (?, ?)",
    );
    for (const argumentFunction of stringArray(collocation, "argument_functions")) {
      functionStatement.run(id, argumentFunction);
    }

    const sourceStatement = this.connection.sqlite.prepare(
      `INSERT INTO collocation_source_links
       (collocation_id, source_essay_id, paragraph_index, sentence_index, sentence_text, card_id,
        surface_form, learning_surface_form, occurrence_index, learning_occurrence_index,
        start_offset, end_offset, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const link of objectArray(collocation, "source_links")) {
      const sentenceText = requiredString(link, "sentence_text");
      const surfaceForm = requiredString(link, "surface_form");
      const occurrenceIndex = requiredNumber(link, "occurrence_index");
      const startOffset = occurrenceOffset(sentenceText, surfaceForm, occurrenceIndex);
      sourceStatement.run(
        id,
        requiredString(link, "source_essay_id"),
        requiredNumber(link, "paragraph_index"),
        requiredNumber(link, "sentence_index"),
        sentenceText,
        nullableString(link, "card_id"),
        surfaceForm,
        nullableString(link, "learning_surface_form"),
        occurrenceIndex,
        nullableNumber(link, "learning_occurrence_index"),
        startOffset,
        startOffset + surfaceForm.length,
        requiredString(link, "role"),
        requiredString(collocation, "updated_at"),
      );
    }

    const learningMode = requiredString(collocation, "learning_mode");
    if (learningMode === "recall_use") {
      const dueAt = requiredString(collocation, "updated_at");
      this.connection.sqlite
        .prepare(
          `INSERT OR IGNORE INTO collocation_progress
           (collocation_id, learning_stage, recall_score, application_score, success_streak,
            lapse_count, interval_days, due_at, last_reviewed_at, updated_at)
           VALUES (?, 'new', NULL, NULL, 0, 0, 0, ?, NULL, ?)`,
        )
        .run(id, dueAt, dueAt);
    } else {
      this.connection.sqlite.prepare("DELETE FROM collocation_progress WHERE collocation_id = ?").run(id);
    }
  }

  private validateCollocationSourceLinks(collocation: JsonObject) {
    for (const link of objectArray(collocation, "source_links")) {
      const sourceId = requiredString(link, "source_essay_id");
      const sourceRow = this.connection.sqlite
        .prepare("SELECT raw_json AS rawJson FROM source_essays WHERE id = ?")
        .get(sourceId) as { rawJson: string } | undefined;
      if (!sourceRow) throw new Error(`来源范文不存在：${sourceId}`);
      const source = JSON.parse(sourceRow.rawJson) as JsonObject;
      const paragraphIndex = requiredNumber(link, "paragraph_index");
      const sentenceIndex = requiredNumber(link, "sentence_index");
      const paragraph = objectArray(source, "paragraphs")
        .find((item) => requiredNumber(item, "paragraph_index") === paragraphIndex);
      if (!paragraph) throw new Error(`来源段落不存在：${sourceId} / ${paragraphIndex}`);
      const sentence = splitSentences(requiredString(paragraph, "text"))[sentenceIndex];
      if (!sentence || sentence !== requiredString(link, "sentence_text")) {
        throw new Error(`来源句定位不一致：${sourceId} / ${paragraphIndex}:${sentenceIndex}`);
      }
      const surfaceForm = requiredString(link, "surface_form");
      const occurrenceIndex = requiredNumber(link, "occurrence_index");
      if (occurrenceOffset(sentence, surfaceForm, occurrenceIndex) < 0) {
        throw new Error(`来源句中找不到搭配：${surfaceForm}`);
      }

      const cardId = nullableString(link, "card_id");
      if (!cardId) continue;
      const cardRow = this.connection.sqlite
        .prepare("SELECT raw_json AS rawJson FROM cards WHERE id = ?")
        .get(cardId) as { rawJson: string } | undefined;
      if (!cardRow) throw new Error(`关联句子卡不存在：${cardId}`);
      const card = JSON.parse(cardRow.rawJson) as JsonObject;
      if (
        requiredString(card, "source_essay_id") !== sourceId
        || requiredNumber(card, "paragraph_index") !== paragraphIndex
        || requiredNumber(card, "sentence_index") !== sentenceIndex
        || requiredString(card, "original_sentence") !== sentence
      ) {
        throw new Error(`关联句子卡与来源句定位不一致：${cardId}`);
      }
      const learningSurface = nullableString(link, "learning_surface_form");
      const learningOccurrence = nullableNumber(link, "learning_occurrence_index");
      if (learningSurface === null || learningOccurrence === null
        || occurrenceOffset(requiredString(card, "learning_sentence"), learningSurface, learningOccurrence) < 0) {
        throw new Error(`关联句子卡中找不到学习搭配：${cardId}`);
      }
    }
  }

  private insertSource(source: JsonObject) {
    const id = requiredString(source, "id");
    const rawJson = stableJson(source);
    const values = [
      requiredString(source, "title"),
      requiredString(source, "source_name"),
      requiredString(source, "source_type"),
      requiredString(source, "answer_origin"),
      requiredString(source, "author"),
      requiredString(source, "question_type"),
      requiredString(source, "content_hash"),
      rawJson,
      requiredString(source, "created_at"),
      requiredString(source, "updated_at"),
    ] as const;
    const existing = this.connection.sqlite
      .prepare("SELECT content_hash AS contentHash, raw_json AS rawJson FROM source_essays WHERE id = ?")
      .get(id) as { contentHash: string; rawJson: string } | undefined;
    if (existing) {
      if (stableJson(JSON.parse(existing.rawJson)) === rawJson) return;
      if (existing.contentHash !== requiredString(source, "content_hash")) {
        throw new Error(`Import conflict: source_essays.id=${id} changed source text`);
      }
      this.connection.sqlite
        .prepare(
          `UPDATE source_essays SET
           title = ?, source_name = ?, source_type = ?, answer_origin = ?, author = ?,
           question_type = ?, content_hash = ?, raw_json = ?, created_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(...values, id);
      return;
    }
    this.connection.sqlite
      .prepare(
        `INSERT INTO source_essays
         (id, title, source_name, source_type, answer_origin, author, question_type,
          content_hash, raw_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, ...values);
  }

  private insertCandidate(candidate: JsonObject) {
    const candidateId = requiredString(candidate, "candidate_id");
    const card = objectField(candidate, "card");
    const rawJson = stableJson(candidate);
    const values = [
      requiredString(card, "id"),
      requiredString(card, "source_essay_id"),
      requiredString(candidate, "workflow_status"),
      requiredString(candidate, "priority"),
      requiredString(card, "normalized_text_hash"),
      rawJson,
      requiredString(candidate, "created_at"),
      requiredString(candidate, "updated_at"),
    ] as const;
    const existing = this.connection.sqlite
      .prepare("SELECT raw_json AS rawJson FROM candidates WHERE candidate_id = ?")
      .get(candidateId) as { rawJson: string } | undefined;
    if (existing) {
      if (stableJson(JSON.parse(existing.rawJson)) === rawJson) return;
      const existingCandidate = JSON.parse(existing.rawJson) as JsonObject;
      const existingRevision = requiredNumber(objectField(existingCandidate, "card"), "content_revision");
      const incomingRevision = requiredNumber(card, "content_revision");
      if (incomingRevision <= existingRevision) {
        throw new Error(`Import conflict: candidates.candidate_id=${candidateId} changed without a newer content revision`);
      }
      this.connection.sqlite
        .prepare(
          `UPDATE candidates SET card_id = ?, source_essay_id = ?, workflow_status = ?, priority = ?,
           normalized_text_hash = ?, raw_json = ?, created_at = ?, updated_at = ?
           WHERE candidate_id = ?`,
        )
        .run(...values, candidateId);
      return;
    }
    this.connection.sqlite
      .prepare(
        `INSERT INTO candidates
         (candidate_id, card_id, source_essay_id, workflow_status, priority,
          normalized_text_hash, raw_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(candidateId, ...values);
  }

  private insertApprovedCard(card: JsonObject) {
    if (requiredString(card, "content_status") !== "approved") {
      throw new Error(`Only approved cards may be imported into cards: ${requiredString(card, "id")}`);
    }
    const id = requiredString(card, "id");
    const rawJson = stableJson(card);
    const values = [
        requiredString(card, "source_essay_id"),
        requiredString(card, "original_sentence"),
        requiredString(card, "learning_sentence"),
        requiredString(card, "translation_zh"),
        requiredNumber(card, "paragraph_index"),
        requiredNumber(card, "sentence_index"),
        requiredString(card, "task"),
        requiredString(card, "primary_focus"),
        requiredNumber(card, "difficulty"),
        requiredNumber(card, "transfer_value"),
        requiredString(card, "source_reliability"),
        requiredString(card, "content_status"),
        requiredNumber(card, "content_revision"),
        requiredString(card, "normalized_text_hash"),
        rawJson,
        requiredString(card, "created_at"),
        requiredString(card, "updated_at"),
      ] as const;
    const existing = this.connection.sqlite
      .prepare("SELECT raw_json AS rawJson, content_revision AS contentRevision FROM cards WHERE id = ?")
      .get(id) as { rawJson: string; contentRevision: number } | undefined;
    if (existing) {
      if (stableJson(JSON.parse(existing.rawJson)) === rawJson) return;
      const incomingRevision = requiredNumber(card, "content_revision");
      if (incomingRevision <= existing.contentRevision) {
        throw new Error(`Import conflict: cards.id=${id} changed without a newer content revision`);
      }
      this.connection.sqlite
        .prepare(
          `UPDATE cards SET source_essay_id = ?, original_sentence = ?, learning_sentence = ?, translation_zh = ?,
           paragraph_index = ?, sentence_index = ?, task = ?, primary_focus = ?, difficulty = ?,
           transfer_value = ?, source_reliability = ?, content_status = ?, content_revision = ?,
           normalized_text_hash = ?, raw_json = ?, created_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(...values, id);
      this.connection.sqlite.prepare("DELETE FROM card_topics WHERE card_id = ?").run(id);
      this.connection.sqlite.prepare("DELETE FROM card_argument_functions WHERE card_id = ?").run(id);
    } else {
      this.connection.sqlite
        .prepare(
          `INSERT INTO cards
           (id, source_essay_id, original_sentence, learning_sentence, translation_zh,
            paragraph_index, sentence_index, task, primary_focus, difficulty,
            transfer_value, source_reliability, content_status, content_revision,
            normalized_text_hash, raw_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, ...values);
    }

    const topicStatement = this.connection.sqlite.prepare("INSERT INTO card_topics (card_id, topic) VALUES (?, ?)");
    for (const topic of stringArray(card, "topics")) topicStatement.run(id, topic);
    const functionStatement = this.connection.sqlite.prepare(
      "INSERT INTO card_argument_functions (card_id, argument_function) VALUES (?, ?)",
    );
    for (const argumentFunction of stringArray(card, "argument_functions")) functionStatement.run(id, argumentFunction);

    if (!existing) {
      const dueAt = requiredString(card, "created_at");
      this.connection.sqlite
        .prepare(
          `INSERT INTO review_states
           (card_id, learning_stage, success_streak, interval_days, due_at, last_reviewed_at, updated_at)
           VALUES (?, 'new', 0, 0, ?, NULL, ?)`,
        )
        .run(id, dueAt, dueAt);
    }
  }
}
