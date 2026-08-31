import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { SqliteConnection } from "./client";
import { ContentRepository } from "./content-repository";
import { sha256, type JsonObject } from "./json";
import { LearningEvidenceRepository } from "./learning-evidence-repository";

const Ajv2020Class = ((Ajv2020 as unknown as { default?: unknown }).default ?? Ajv2020) as new (
  options?: Record<string, unknown>,
) => {
  addSchema(schema: unknown): void;
  compile<T>(schema: unknown): ValidateFunction<T>;
};
const addFormatsToAjv = ((addFormats as unknown as { default?: unknown }).default ?? addFormats) as (
  ajv: InstanceType<typeof Ajv2020Class>,
) => void;

export interface FullBackup extends JsonObject {
  schema_version: "1.0.0" | "1.1.0" | "1.2.0" | "1.3.0" | "1.4.0" | "1.5.0" | "1.6.0" | "1.7.0" | "1.8.0" | "1.9.0" | "1.10.0" | "1.11.0";
  backup_id: string;
  app_version: string;
  exported_at: string;
  timezone: string;
  sources: JsonObject[];
  cards: JsonObject[];
  candidates: JsonObject[];
  attempts: JsonObject[];
  review_states: JsonObject[];
  collocation_candidates?: JsonObject[];
  collocations?: JsonObject[];
  collocation_source_links?: JsonObject[];
  collocation_attempts?: JsonObject[];
  collocation_progress?: JsonObject[];
  agent_traces?: JsonObject[];
  use_evaluation_runs?: JsonObject[];
  learning_evidence?: JsonObject[];
  adaptive_training_decisions?: JsonObject[];
  adaptive_retests?: JsonObject[];
  guided_writing_sessions?: JsonObject[];
  guided_writing_turns?: JsonObject[];
  guided_writing_paragraph_drafts?: JsonObject[];
  guided_writing_node_language_attempts?: JsonObject[];
  guided_writing_introduction_drafts?: JsonObject[];
  guided_writing_conclusion_drafts?: JsonObject[];
  guided_writing_full_essay_reviews?: JsonObject[];
  guided_writing_prompt_analyses?: JsonObject[];
  settings: {
    daily_new_card_limit: number;
    adaptive_use_started_at?: string;
    collocation_use_started_at?: string;
    learner_model_evidence_started_at?: string;
  };
  payload_hash: string;
}

function rows<T extends JsonObject>(connection: SqliteConnection, sql: string): T[] {
  return connection.sqlite.prepare(sql).all() as T[];
}

function backupPayload(backup: Omit<FullBackup, "payload_hash"> | FullBackup) {
  const { payload_hash: _ignored, ...payload } = backup as FullBackup;
  return payload;
}

export function verifyBackupHash(backup: FullBackup): boolean {
  return sha256(backupPayload(backup)) === backup.payload_hash;
}

export function exportFullBackup(
  connection: SqliteConnection,
  options: { appVersion?: string; timezone?: string; exportedAt?: string; backupId?: string } = {},
): FullBackup {
  new LearningEvidenceRepository(connection).syncAllAttempts();
  const repository = new ContentRepository(connection);
  const attempts = rows<JsonObject>(
    connection,
    `SELECT id, card_id, exercise_type, prompt_snapshot, user_answer, self_rating,
            CAST(hint_used AS INTEGER) AS hint_used, attempt_count, duration_ms, completed_at
     FROM attempts ORDER BY completed_at, id`,
  ).map((attempt) => ({ ...attempt, hint_used: Boolean(attempt.hint_used) }));
  const reviewStates = rows<JsonObject>(
    connection,
    `SELECT card_id, learning_stage, success_streak, interval_days, due_at, last_reviewed_at
     FROM review_states ORDER BY card_id`,
  );
  const collocationSourceLinks = rows<JsonObject>(
    connection,
    `SELECT collocation_id, source_essay_id, paragraph_index, sentence_index, sentence_text,
            card_id, surface_form, learning_surface_form, occurrence_index,
            learning_occurrence_index, start_offset, end_offset, role, created_at
     FROM collocation_source_links
     ORDER BY collocation_id, source_essay_id, paragraph_index, sentence_index, occurrence_index`,
  );
  const collocationAttempts = rows<JsonObject>(
    connection,
    `SELECT id, collocation_id, exercise_type, prompt_snapshot, user_answer, normalized_answer,
            match_result, self_rating, CAST(hint_used AS INTEGER) AS hint_used,
            attempt_count, duration_ms, completed_at
     FROM collocation_attempts ORDER BY completed_at, id`,
  ).map((attempt) => ({ ...attempt, hint_used: Boolean(attempt.hint_used) }));
  const collocationProgress = rows<JsonObject>(
    connection,
    `SELECT collocation_id, learning_stage, recall_score, application_score, success_streak,
            lapse_count, interval_days, due_at, last_reviewed_at
     FROM collocation_progress ORDER BY collocation_id`,
  );
  const agentTraces = rows<JsonObject>(
    connection,
    `SELECT id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
            provider, model, prompt_version, schema_version, input_tokens, output_tokens,
            error_codes_json, created_at, updated_at
     FROM agent_traces ORDER BY started_at, id`,
  );
  const useEvaluationRuns = rows<JsonObject>(
    connection,
    `SELECT attempt_id, exercise_ref, exercise_kind, asset_id, asset_revision, input_hash,
            learner_answer, previous_attempt_id, retry_index, status, evaluation_json, feedback_json,
            teaching_action_json, trace_id, error_code,
            created_at, completed_at, updated_at
     FROM use_evaluation_runs ORDER BY created_at, attempt_id`,
  );
  const learningEvidence = rows<JsonObject>(
    connection,
    `SELECT id, learner_id, asset_id, asset_type, dimension, outcome, context_json,
            evaluator_json, source_kind, source_id, evidence_version, occurred_at, created_at
     FROM learning_evidence ORDER BY occurred_at, id`,
  );
  const adaptiveTrainingDecisions = rows<JsonObject>(
    connection,
    `SELECT id, learner_id, trigger_kind, trigger_id, asset_id, asset_type, policy_version,
            action_json, reason_codes_json, input_evidence_ids_json, candidate_actions_json,
            guard_results_json, trace_id, created_at
     FROM adaptive_training_decisions ORDER BY created_at, id`,
  );
  const adaptiveRetests = rows<JsonObject>(
    connection,
    `SELECT id, learner_id, asset_id, asset_type, source_decision_id, purpose, due_at,
            status, created_at, updated_at
     FROM adaptive_retests ORDER BY due_at, id`,
  );
  const guidedWritingSessions = rows<JsonObject>(
    connection,
    `SELECT id, learner_id, source_essay_id, paragraph_key, task_analysis_version,
            prompt_snapshot, question_type, status, current_node, argument_graph_json,
            created_at, updated_at
     FROM guided_writing_sessions ORDER BY created_at, id`,
  );
  const guidedWritingTurns = rows<JsonObject>(
    connection,
    `SELECT id, session_id, node, question_en, learner_answer, origin, input_hash, status,
            evaluation_json, action_json, trace_id, error_code, created_at, completed_at, updated_at
     FROM guided_writing_turns ORDER BY created_at, id`,
  );
  const guidedWritingParagraphDrafts = rows<JsonObject>(
    connection,
    `SELECT id, session_id, paragraph_key, draft_text, input_hash, status, evaluation_json,
            trace_id, error_code, created_at, completed_at, updated_at
     FROM guided_writing_paragraph_drafts ORDER BY created_at, id`,
  );
  const guidedWritingNodeLanguageAttempts = rows<JsonObject>(
    connection,
    `SELECT id, session_id, node, learner_text, asset_type, asset_id, hint_level, input_hash,
            status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at
     FROM guided_writing_node_language_attempts ORDER BY created_at, id`,
  );
  const guidedWritingIntroductionDrafts = rows<JsonObject>(
    connection,
    `SELECT id, learner_id, source_essay_id, body_1_session_id, body_2_session_id,
            opening_text, task_framing_text, thesis_text, draft_text, input_hash, status,
            evaluation_json, trace_id, error_code, created_at, completed_at, updated_at
     FROM guided_writing_introduction_drafts ORDER BY created_at, id`,
  );
  const guidedWritingConclusionDrafts = rows<JsonObject>(connection,
    `SELECT id, learner_id, source_essay_id, introduction_draft_id, body_1_draft_id,
            body_2_draft_id, conclusion_text, input_hash, status, evaluation_json, trace_id,
            error_code, created_at, completed_at, updated_at
     FROM guided_writing_conclusion_drafts ORDER BY created_at, id`);
  const guidedWritingFullEssayReviews = rows<JsonObject>(connection,
    `SELECT id, learner_id, source_essay_id, introduction_draft_id, body_1_draft_id,
            body_2_draft_id, conclusion_draft_id, input_hash, status, evaluation_json, trace_id,
            error_code, created_at, completed_at, updated_at
     FROM guided_writing_full_essay_reviews ORDER BY created_at, id`);
  const guidedWritingPromptAnalyses = rows<JsonObject>(connection,
    `SELECT id, learner_id, prompt_text, prompt_hash, status, analysis_json, trace_id,
            error_code, created_at, completed_at, updated_at
     FROM guided_writing_prompt_analyses ORDER BY created_at, id`);
  const setting = connection.sqlite
    .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'daily_new_card_limit'")
    .get() as { valueJson: string } | undefined;
  const adaptiveUseSetting = connection.sqlite
    .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'adaptive_use_started_at'")
    .get() as { valueJson: string } | undefined;
  const collocationUseSetting = connection.sqlite
    .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'collocation_use_started_at'")
    .get() as { valueJson: string } | undefined;
  const learnerEvidenceSetting = connection.sqlite
    .prepare("SELECT value_json AS valueJson FROM settings WHERE key = 'learner_model_evidence_started_at'")
    .get() as { valueJson: string } | undefined;

  const payload: Omit<FullBackup, "payload_hash"> = {
    schema_version: "1.11.0",
    backup_id: options.backupId ?? randomUUID(),
    app_version: options.appVersion ?? "0.1.0",
    exported_at: options.exportedAt ?? new Date().toISOString(),
    timezone: options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    sources: repository.listSources(),
    cards: repository.listCards(),
    candidates: repository.listCandidates(),
    attempts,
    review_states: reviewStates,
    collocation_candidates: repository.listCollocationCandidates(),
    collocations: repository.listCollocations(),
    collocation_source_links: collocationSourceLinks,
    collocation_attempts: collocationAttempts,
    collocation_progress: collocationProgress,
    agent_traces: agentTraces,
    use_evaluation_runs: useEvaluationRuns,
    learning_evidence: learningEvidence,
    adaptive_training_decisions: adaptiveTrainingDecisions,
    adaptive_retests: adaptiveRetests,
    guided_writing_sessions: guidedWritingSessions,
    guided_writing_turns: guidedWritingTurns,
    guided_writing_paragraph_drafts: guidedWritingParagraphDrafts,
    guided_writing_node_language_attempts: guidedWritingNodeLanguageAttempts,
    guided_writing_introduction_drafts: guidedWritingIntroductionDrafts,
    guided_writing_conclusion_drafts: guidedWritingConclusionDrafts,
    guided_writing_full_essay_reviews: guidedWritingFullEssayReviews,
    guided_writing_prompt_analyses: guidedWritingPromptAnalyses,
    settings: {
      daily_new_card_limit: setting ? Number(JSON.parse(setting.valueJson)) : 5,
      ...(adaptiveUseSetting ? { adaptive_use_started_at: String(JSON.parse(adaptiveUseSetting.valueJson)) } : {}),
      ...(collocationUseSetting
        ? { collocation_use_started_at: String(JSON.parse(collocationUseSetting.valueJson)) }
        : {}),
      ...(learnerEvidenceSetting
        ? { learner_model_evidence_started_at: String(JSON.parse(learnerEvidenceSetting.valueJson)) }
        : {}),
    },
  };
  return { ...payload, payload_hash: sha256(payload) } as FullBackup;
}

export async function createBackupValidator(projectRoot = process.cwd()): Promise<ValidateFunction<FullBackup>> {
  const schemaFiles = [
    "common.schema.json",
    "source-essay.schema.json",
    "guided-writing-prompt.schema.json",
    "sentence-card.schema.json",
    "candidate-card.schema.json",
    "collocation.schema.json",
    "backup.schema.json",
  ];
  const schemas = await Promise.all(
    schemaFiles.map(async (filename) => JSON.parse(await readFile(path.join(projectRoot, "schemas", filename), "utf8"))),
  );
  const ajv = new Ajv2020Class({ allErrors: true, strict: true });
  addFormatsToAjv(ajv);
  for (const schema of schemas.slice(0, -1)) ajv.addSchema(schema);
  return ajv.compile<FullBackup>(schemas.at(-1));
}

export interface RestoreResult {
  rollbackBackupPath: string | null;
  counts: ReturnType<ContentRepository["getCounts"]>;
}

export async function restoreFullBackup(
  connection: SqliteConnection,
  backup: FullBackup,
  options: {
    projectRoot?: string;
    rollbackDirectory?: string;
    restoredAt?: string;
  } = {},
): Promise<RestoreResult> {
  const validate = await createBackupValidator(options.projectRoot);
  if (!validate(backup)) {
    throw new Error(`Backup schema validation failed: ${JSON.stringify(validate.errors)}`);
  }
  if (!verifyBackupHash(backup)) throw new Error("Backup payload hash mismatch");

  const repository = new ContentRepository(connection);
  const currentCounts = repository.getCounts();
  let rollbackBackupPath: string | null = null;
  if (Object.values(currentCounts).some((count) => count > 0)) {
    const rollback = exportFullBackup(connection);
    const rollbackDirectory = path.resolve(options.rollbackDirectory ?? "backups");
    await mkdir(rollbackDirectory, { recursive: true });
    rollbackBackupPath = path.join(rollbackDirectory, `before-restore-${rollback.backup_id}.json`);
    await writeFile(rollbackBackupPath, `${JSON.stringify(rollback, null, 2)}\n`, "utf8");
  }

  const restoredAt = options.restoredAt ?? new Date().toISOString();
  connection.sqlite.transaction(() => {
    for (const table of [
      "guided_writing_full_essay_reviews",
      "guided_writing_conclusion_drafts",
      "guided_writing_introduction_drafts",
      "guided_writing_node_language_attempts",
      "guided_writing_paragraph_drafts",
      "guided_writing_turns",
      "guided_writing_sessions",
      "guided_writing_prompt_analyses",
      "adaptive_retests",
      "adaptive_training_decisions",
      "learning_evidence",
      "use_evaluation_runs",
      "agent_traces",
      "collocation_attempts",
      "collocation_progress",
      "collocation_source_links",
      "collocation_argument_functions",
      "collocation_topics",
      "collocations",
      "collocation_candidates",
      "collocation_imports",
      "attempts",
      "review_states",
      "card_argument_functions",
      "card_topics",
      "cards",
      "candidates",
      "source_essays",
      "settings",
      "content_imports",
    ]) {
      connection.sqlite.exec(`DELETE FROM ${table}`);
    }

    repository.importSeeds({
      sources: backup.sources,
      candidates: backup.candidates,
      approvedCards: backup.cards,
    }, restoredAt);
    repository.restoreCollocationCandidates(backup.collocation_candidates ?? []);
    repository.restoreCollocations(backup.collocations ?? []);

    const traceStatement = connection.sqlite.prepare(
      `INSERT INTO agent_traces
       (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
        provider, model, prompt_version, schema_version, input_tokens, output_tokens,
        error_codes_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const trace of backup.agent_traces ?? []) {
      traceStatement.run(
        trace.id,
        trace.learner_id_hash,
        trace.feature,
        trace.status,
        trace.started_at,
        trace.completed_at,
        trace.steps_json,
        trace.provider,
        trace.model,
        trace.prompt_version,
        trace.schema_version,
        trace.input_tokens,
        trace.output_tokens,
        trace.error_codes_json,
        trace.created_at,
        trace.updated_at,
      );
    }
    const promptAnalysisStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_prompt_analyses
       (id, learner_id, prompt_text, prompt_hash, status, analysis_json, trace_id, error_code,
        created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const analysis of backup.guided_writing_prompt_analyses ?? []) promptAnalysisStatement.run(
      analysis.id, analysis.learner_id, analysis.prompt_text, analysis.prompt_hash, analysis.status,
      analysis.analysis_json, analysis.trace_id, analysis.error_code, analysis.created_at,
      analysis.completed_at, analysis.updated_at,
    );
    const guidedSessionStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_sessions
       (id, learner_id, source_essay_id, paragraph_key, task_analysis_version, prompt_snapshot,
        question_type, status, current_node, argument_graph_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const session of backup.guided_writing_sessions ?? []) {
      guidedSessionStatement.run(
        session.id,
        session.learner_id,
        session.source_essay_id,
        session.paragraph_key,
        session.task_analysis_version,
        session.prompt_snapshot,
        session.question_type,
        session.status,
        session.current_node,
        session.argument_graph_json,
        session.created_at,
        session.updated_at,
      );
    }
    const guidedTurnStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_turns
       (id, session_id, node, question_en, learner_answer, origin, input_hash, status,
        evaluation_json, action_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const turn of backup.guided_writing_turns ?? []) {
      guidedTurnStatement.run(
        turn.id,
        turn.session_id,
        turn.node,
        turn.question_en,
        turn.learner_answer,
        turn.origin,
        turn.input_hash,
        turn.status,
        turn.evaluation_json,
        turn.action_json,
        turn.trace_id,
        turn.error_code,
        turn.created_at,
        turn.completed_at,
        turn.updated_at,
      );
    }
    const guidedDraftStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_paragraph_drafts
       (id, session_id, paragraph_key, draft_text, input_hash, status, evaluation_json,
        trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const draft of backup.guided_writing_paragraph_drafts ?? []) {
      guidedDraftStatement.run(
        draft.id,
        draft.session_id,
        draft.paragraph_key,
        draft.draft_text,
        draft.input_hash,
        draft.status,
        draft.evaluation_json,
        draft.trace_id,
        draft.error_code,
        draft.created_at,
        draft.completed_at,
        draft.updated_at,
      );
    }
    const guidedNodeAttemptStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_node_language_attempts
       (id, session_id, node, learner_text, asset_type, asset_id, hint_level, input_hash,
        status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const attempt of backup.guided_writing_node_language_attempts ?? []) {
      guidedNodeAttemptStatement.run(
        attempt.id,
        attempt.session_id,
        attempt.node,
        attempt.learner_text,
        attempt.asset_type,
        attempt.asset_id,
        attempt.hint_level,
        attempt.input_hash,
        attempt.status,
        attempt.evaluation_json,
        attempt.trace_id,
        attempt.error_code,
        attempt.created_at,
        attempt.completed_at,
        attempt.updated_at,
      );
    }
    const guidedIntroductionStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_introduction_drafts
       (id, learner_id, source_essay_id, body_1_session_id, body_2_session_id,
        opening_text, task_framing_text, thesis_text, draft_text, input_hash, status,
        evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const draft of backup.guided_writing_introduction_drafts ?? []) {
      guidedIntroductionStatement.run(
        draft.id,
        draft.learner_id,
        draft.source_essay_id,
        draft.body_1_session_id,
        draft.body_2_session_id,
        draft.opening_text,
        draft.task_framing_text,
        draft.thesis_text,
        draft.draft_text,
        draft.input_hash,
        draft.status,
        draft.evaluation_json,
        draft.trace_id,
        draft.error_code,
        draft.created_at,
        draft.completed_at,
        draft.updated_at,
      );
    }
    const conclusionStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_conclusion_drafts
       (id, learner_id, source_essay_id, introduction_draft_id, body_1_draft_id, body_2_draft_id,
        conclusion_text, input_hash, status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const draft of backup.guided_writing_conclusion_drafts ?? []) conclusionStatement.run(
      draft.id, draft.learner_id, draft.source_essay_id, draft.introduction_draft_id,
      draft.body_1_draft_id, draft.body_2_draft_id, draft.conclusion_text, draft.input_hash,
      draft.status, draft.evaluation_json, draft.trace_id, draft.error_code, draft.created_at,
      draft.completed_at, draft.updated_at,
    );
    const fullEssayStatement = connection.sqlite.prepare(
      `INSERT INTO guided_writing_full_essay_reviews
       (id, learner_id, source_essay_id, introduction_draft_id, body_1_draft_id, body_2_draft_id,
        conclusion_draft_id, input_hash, status, evaluation_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const review of backup.guided_writing_full_essay_reviews ?? []) fullEssayStatement.run(
      review.id, review.learner_id, review.source_essay_id, review.introduction_draft_id,
      review.body_1_draft_id, review.body_2_draft_id, review.conclusion_draft_id, review.input_hash,
      review.status, review.evaluation_json, review.trace_id, review.error_code, review.created_at,
      review.completed_at, review.updated_at,
    );
    const adaptiveDecisionStatement = connection.sqlite.prepare(
      `INSERT INTO adaptive_training_decisions
       (id, learner_id, trigger_kind, trigger_id, asset_id, asset_type, policy_version,
        action_json, reason_codes_json, input_evidence_ids_json, candidate_actions_json,
        guard_results_json, trace_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const decision of backup.adaptive_training_decisions ?? []) {
      adaptiveDecisionStatement.run(
        decision.id,
        decision.learner_id,
        decision.trigger_kind,
        decision.trigger_id,
        decision.asset_id,
        decision.asset_type,
        decision.policy_version,
        decision.action_json,
        decision.reason_codes_json,
        decision.input_evidence_ids_json,
        decision.candidate_actions_json,
        decision.guard_results_json,
        decision.trace_id,
        decision.created_at,
      );
    }
    const adaptiveRetestStatement = connection.sqlite.prepare(
      `INSERT INTO adaptive_retests
       (id, learner_id, asset_id, asset_type, source_decision_id, purpose, due_at,
        status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const retest of backup.adaptive_retests ?? []) {
      adaptiveRetestStatement.run(
        retest.id,
        retest.learner_id,
        retest.asset_id,
        retest.asset_type,
        retest.source_decision_id,
        retest.purpose,
        retest.due_at,
        retest.status,
        retest.created_at,
        retest.updated_at,
      );
    }
    const evaluationStatement = connection.sqlite.prepare(
      `INSERT INTO use_evaluation_runs
       (attempt_id, exercise_ref, exercise_kind, asset_id, asset_revision, input_hash,
        learner_answer, previous_attempt_id, retry_index, status, evaluation_json, feedback_json,
        teaching_action_json, trace_id, error_code, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const run of backup.use_evaluation_runs ?? []) {
      evaluationStatement.run(
        run.attempt_id,
        run.exercise_ref,
        run.exercise_kind,
        run.asset_id,
        run.asset_revision,
        run.input_hash,
        run.learner_answer,
        run.previous_attempt_id ?? null,
        run.retry_index ?? 0,
        run.status,
        run.evaluation_json,
        run.feedback_json,
        run.teaching_action_json ?? null,
        run.trace_id,
        run.error_code,
        run.created_at,
        run.completed_at,
        run.updated_at,
      );
    }

    connection.sqlite.exec("DELETE FROM review_states");
    const reviewStatement = connection.sqlite.prepare(
      `INSERT INTO review_states
       (card_id, learning_stage, success_streak, interval_days, due_at, last_reviewed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const state of backup.review_states) {
      reviewStatement.run(
        state.card_id,
        state.learning_stage,
        state.success_streak,
        state.interval_days,
        state.due_at,
        state.last_reviewed_at,
        restoredAt,
      );
    }

    connection.sqlite.exec("DELETE FROM settings");
    connection.sqlite
      .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run("daily_new_card_limit", JSON.stringify(backup.settings.daily_new_card_limit), restoredAt);
    connection.sqlite
      .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run("adaptive_use_started_at", JSON.stringify(backup.settings.adaptive_use_started_at ?? restoredAt), restoredAt);
    connection.sqlite
      .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run(
        "collocation_use_started_at",
        JSON.stringify(backup.settings.collocation_use_started_at ?? restoredAt),
        restoredAt,
      );
    if (backup.settings.learner_model_evidence_started_at) {
      connection.sqlite
        .prepare("INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)")
        .run(
          "learner_model_evidence_started_at",
          JSON.stringify(backup.settings.learner_model_evidence_started_at),
          restoredAt,
        );
    }

    const attemptStatement = connection.sqlite.prepare(
      `INSERT INTO attempts
       (id, card_id, exercise_type, prompt_snapshot, user_answer, self_rating,
        hint_used, attempt_count, duration_ms, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const attempt of backup.attempts) {
      attemptStatement.run(
        attempt.id,
        attempt.card_id,
        attempt.exercise_type,
        attempt.prompt_snapshot,
        attempt.user_answer,
        attempt.self_rating,
        attempt.hint_used ? 1 : 0,
        attempt.attempt_count,
        attempt.duration_ms,
        attempt.completed_at,
      );
    }

    connection.sqlite.exec("DELETE FROM collocation_progress");
    const collocationProgressStatement = connection.sqlite.prepare(
      `INSERT INTO collocation_progress
       (collocation_id, learning_stage, recall_score, application_score, success_streak,
        lapse_count, interval_days, due_at, last_reviewed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const progress of backup.collocation_progress ?? []) {
      collocationProgressStatement.run(
        progress.collocation_id,
        progress.learning_stage,
        progress.recall_score,
        progress.application_score,
        progress.success_streak,
        progress.lapse_count,
        progress.interval_days,
        progress.due_at,
        progress.last_reviewed_at,
        restoredAt,
      );
    }

    const collocationAttemptStatement = connection.sqlite.prepare(
      `INSERT INTO collocation_attempts
       (id, collocation_id, exercise_type, prompt_snapshot, user_answer, normalized_answer,
        match_result, self_rating, hint_used, attempt_count, duration_ms, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const attempt of backup.collocation_attempts ?? []) {
      collocationAttemptStatement.run(
        attempt.id,
        attempt.collocation_id,
        attempt.exercise_type,
        attempt.prompt_snapshot,
        attempt.user_answer,
        attempt.normalized_answer,
        attempt.match_result,
        attempt.self_rating,
        attempt.hint_used ? 1 : 0,
        attempt.attempt_count,
        attempt.duration_ms,
        attempt.completed_at,
      );
    }

    if (backup.learning_evidence) {
      const evidenceStatement = connection.sqlite.prepare(
        `INSERT INTO learning_evidence
         (id, learner_id, asset_id, asset_type, dimension, outcome, context_json, evaluator_json,
          source_kind, source_id, evidence_version, occurred_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const evidence of backup.learning_evidence) {
        evidenceStatement.run(
          evidence.id,
          evidence.learner_id,
          evidence.asset_id,
          evidence.asset_type,
          evidence.dimension,
          evidence.outcome,
          evidence.context_json,
          evidence.evaluator_json,
          evidence.source_kind,
          evidence.source_id,
          evidence.evidence_version,
          evidence.occurred_at,
          evidence.created_at,
        );
      }
    } else {
      new LearningEvidenceRepository(connection).syncAllAttempts();
    }
  })();

  return { rollbackBackupPath, counts: repository.getCounts() };
}
