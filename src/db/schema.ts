import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const sourceEssays = sqliteTable(
  "source_essays",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    sourceName: text("source_name").notNull(),
    sourceType: text("source_type").notNull(),
    answerOrigin: text("answer_origin").notNull(),
    author: text("author").notNull(),
    questionType: text("question_type").notNull(),
    contentHash: text("content_hash").notNull(),
    rawJson: text("raw_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("source_essays_content_hash_uq").on(table.contentHash)],
);

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    sourceEssayId: text("source_essay_id")
      .notNull()
      .references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    originalSentence: text("original_sentence").notNull(),
    learningSentence: text("learning_sentence").notNull(),
    translationZh: text("translation_zh").notNull(),
    paragraphIndex: integer("paragraph_index").notNull(),
    sentenceIndex: integer("sentence_index").notNull(),
    task: text("task").notNull(),
    primaryFocus: text("primary_focus").notNull(),
    difficulty: integer("difficulty").notNull(),
    transferValue: integer("transfer_value").notNull(),
    sourceReliability: text("source_reliability").notNull(),
    contentStatus: text("content_status").notNull(),
    contentRevision: integer("content_revision").notNull(),
    normalizedTextHash: text("normalized_text_hash").notNull(),
    isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    rawJson: text("raw_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("cards_normalized_text_hash_uq").on(table.normalizedTextHash),
    index("cards_source_essay_idx").on(table.sourceEssayId),
    index("cards_status_idx").on(table.contentStatus),
  ],
);

export const candidates = sqliteTable(
  "candidates",
  {
    candidateId: text("candidate_id").primaryKey(),
    cardId: text("card_id").notNull(),
    sourceEssayId: text("source_essay_id")
      .notNull()
      .references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    workflowStatus: text("workflow_status").notNull(),
    priority: text("priority").notNull(),
    normalizedTextHash: text("normalized_text_hash").notNull(),
    rawJson: text("raw_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("candidates_card_id_uq").on(table.cardId),
    index("candidates_status_idx").on(table.workflowStatus),
  ],
);

export const cardTopics = sqliteTable(
  "card_topics",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade", onUpdate: "cascade" }),
    topic: text("topic").notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.topic] }), index("card_topics_topic_idx").on(table.topic)],
);

export const cardArgumentFunctions = sqliteTable(
  "card_argument_functions",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade", onUpdate: "cascade" }),
    argumentFunction: text("argument_function").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.argumentFunction] }),
    index("card_argument_functions_value_idx").on(table.argumentFunction),
  ],
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade", onUpdate: "cascade" }),
    exerciseType: text("exercise_type").notNull(),
    promptSnapshot: text("prompt_snapshot").notNull(),
    userAnswer: text("user_answer").notNull(),
    selfRating: text("self_rating").notNull(),
    hintUsed: integer("hint_used", { mode: "boolean" }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    durationMs: integer("duration_ms"),
    completedAt: text("completed_at").notNull(),
  },
  (table) => [
    index("attempts_card_completed_idx").on(table.cardId, table.completedAt),
    index("attempts_completed_idx").on(table.completedAt),
  ],
);

export const reviewStates = sqliteTable("review_states", {
  cardId: text("card_id")
    .primaryKey()
    .references(() => cards.id, { onDelete: "cascade", onUpdate: "cascade" }),
  learningStage: text("learning_stage").notNull(),
  successStreak: integer("success_streak").notNull().default(0),
  intervalDays: real("interval_days").notNull().default(0),
  dueAt: text("due_at").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
  updatedAt: text("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contentImports = sqliteTable("content_imports", {
  importHash: text("import_hash").primaryKey(),
  sourceCount: integer("source_count").notNull(),
  candidateCount: integer("candidate_count").notNull(),
  approvedCardCount: integer("approved_card_count").notNull(),
  importedAt: text("imported_at").notNull(),
});

export const collocationCandidates = sqliteTable(
  "collocation_candidates",
  {
    id: text("id").primaryKey(),
    workflowStatus: text("workflow_status").notNull(),
    learningMode: text("learning_mode").notNull().default("recall_use"),
    priority: text("priority").notNull(),
    normalizedTextHash: text("normalized_text_hash").notNull(),
    dedupGroupKey: text("dedup_group_key").notNull(),
    rawJson: text("raw_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("collocation_candidates_status_idx").on(table.workflowStatus),
    index("collocation_candidates_hash_idx").on(table.normalizedTextHash),
    index("collocation_candidates_group_idx").on(table.dedupGroupKey),
  ],
);

export const collocations = sqliteTable(
  "collocations",
  {
    id: text("id").primaryKey(),
    canonicalText: text("canonical_text").notNull(),
    translationPrompt: text("translation_prompt").notNull(),
    pattern: text("pattern"),
    expressionType: text("expression_type").notNull(),
    learningMode: text("learning_mode").notNull().default("recall_use"),
    difficulty: integer("difficulty").notNull(),
    contentStatus: text("content_status").notNull(),
    contentRevision: integer("content_revision").notNull(),
    normalizedTextHash: text("normalized_text_hash").notNull(),
    rawJson: text("raw_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("collocations_normalized_text_hash_uq").on(table.normalizedTextHash),
    index("collocations_status_idx").on(table.contentStatus),
    index("collocations_learning_mode_idx").on(table.learningMode),
  ],
);

export const collocationTopics = sqliteTable(
  "collocation_topics",
  {
    collocationId: text("collocation_id")
      .notNull()
      .references(() => collocations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    topic: text("topic").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collocationId, table.topic] }),
    index("collocation_topics_topic_idx").on(table.topic),
  ],
);

export const collocationArgumentFunctions = sqliteTable(
  "collocation_argument_functions",
  {
    collocationId: text("collocation_id")
      .notNull()
      .references(() => collocations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    argumentFunction: text("argument_function").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collocationId, table.argumentFunction] }),
    index("collocation_argument_functions_value_idx").on(table.argumentFunction),
  ],
);

export const collocationSourceLinks = sqliteTable(
  "collocation_source_links",
  {
    collocationId: text("collocation_id")
      .notNull()
      .references(() => collocations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sourceEssayId: text("source_essay_id")
      .notNull()
      .references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    paragraphIndex: integer("paragraph_index").notNull(),
    sentenceIndex: integer("sentence_index").notNull(),
    sentenceText: text("sentence_text").notNull(),
    cardId: text("card_id").references(() => cards.id, { onDelete: "restrict", onUpdate: "cascade" }),
    surfaceForm: text("surface_form").notNull(),
    learningSurfaceForm: text("learning_surface_form"),
    occurrenceIndex: integer("occurrence_index").notNull(),
    learningOccurrenceIndex: integer("learning_occurrence_index"),
    startOffset: integer("start_offset"),
    endOffset: integer("end_offset"),
    role: text("role").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.collocationId,
        table.sourceEssayId,
        table.paragraphIndex,
        table.sentenceIndex,
        table.surfaceForm,
        table.occurrenceIndex,
      ],
    }),
    index("collocation_source_links_collocation_idx").on(table.collocationId),
    index("collocation_source_links_source_idx").on(table.sourceEssayId),
    index("collocation_source_links_card_idx").on(table.cardId),
  ],
);

export const collocationProgress = sqliteTable("collocation_progress", {
  collocationId: text("collocation_id")
    .primaryKey()
    .references(() => collocations.id, { onDelete: "cascade", onUpdate: "cascade" }),
  learningStage: text("learning_stage").notNull(),
  recallScore: real("recall_score"),
  applicationScore: real("application_score"),
  successStreak: integer("success_streak").notNull().default(0),
  lapseCount: integer("lapse_count").notNull().default(0),
  intervalDays: real("interval_days").notNull().default(0),
  dueAt: text("due_at").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
  updatedAt: text("updated_at").notNull(),
});

export const collocationAttempts = sqliteTable(
  "collocation_attempts",
  {
    id: text("id").primaryKey(),
    collocationId: text("collocation_id")
      .notNull()
      .references(() => collocations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    exerciseType: text("exercise_type").notNull(),
    promptSnapshot: text("prompt_snapshot").notNull(),
    userAnswer: text("user_answer").notNull(),
    normalizedAnswer: text("normalized_answer").notNull(),
    matchResult: text("match_result").notNull(),
    selfRating: text("self_rating").notNull(),
    hintUsed: integer("hint_used", { mode: "boolean" }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    durationMs: integer("duration_ms"),
    completedAt: text("completed_at").notNull(),
  },
  (table) => [
    index("collocation_attempts_item_completed_idx").on(table.collocationId, table.completedAt),
  ],
);

export const collocationImports = sqliteTable("collocation_imports", {
  importHash: text("import_hash").primaryKey(),
  candidateCount: integer("candidate_count").notNull(),
  approvedCount: integer("approved_count").notNull(),
  relationCount: integer("relation_count").notNull(),
  importedAt: text("imported_at").notNull(),
});

export const agentTraces = sqliteTable(
  "agent_traces",
  {
    id: text("id").primaryKey(),
    learnerIdHash: text("learner_id_hash").notNull(),
    feature: text("feature").notNull(),
    status: text("status").notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    stepsJson: text("steps_json").notNull(),
    provider: text("provider"),
    model: text("model"),
    promptVersion: text("prompt_version").notNull(),
    schemaVersion: text("schema_version").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    errorCodesJson: text("error_codes_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("agent_traces_feature_started_idx").on(table.feature, table.startedAt),
    index("agent_traces_status_idx").on(table.status),
  ],
);

export const useEvaluationRuns = sqliteTable(
  "use_evaluation_runs",
  {
    attemptId: text("attempt_id").primaryKey(),
    exerciseRef: text("exercise_ref").notNull(),
    exerciseKind: text("exercise_kind").notNull(),
    assetId: text("asset_id").notNull(),
    assetRevision: integer("asset_revision").notNull(),
    inputHash: text("input_hash").notNull(),
    learnerAnswer: text("learner_answer").notNull(),
    previousAttemptId: text("previous_attempt_id"),
    retryIndex: integer("retry_index").notNull().default(0),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    feedbackJson: text("feedback_json"),
    teachingActionJson: text("teaching_action_json"),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("use_evaluation_runs_trace_uq").on(table.traceId),
    index("use_evaluation_runs_asset_idx").on(table.exerciseKind, table.assetId, table.createdAt),
    index("use_evaluation_runs_status_idx").on(table.status),
    index("use_evaluation_runs_previous_attempt_idx").on(table.previousAttemptId),
  ],
);

export const learningEvidence = sqliteTable(
  "learning_evidence",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    assetId: text("asset_id").notNull(),
    assetType: text("asset_type").notNull(),
    dimension: text("dimension").notNull(),
    outcome: text("outcome").notNull(),
    contextJson: text("context_json").notNull(),
    evaluatorJson: text("evaluator_json").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceId: text("source_id").notNull(),
    evidenceVersion: text("evidence_version").notNull(),
    occurredAt: text("occurred_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("learning_evidence_source_dimension_uq").on(table.sourceKind, table.sourceId, table.dimension),
    index("learning_evidence_learner_asset_idx").on(table.learnerId, table.assetId, table.occurredAt),
    index("learning_evidence_dimension_idx").on(table.dimension, table.outcome),
  ],
);

export const adaptiveTrainingDecisions = sqliteTable(
  "adaptive_training_decisions",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    triggerKind: text("trigger_kind").notNull(),
    triggerId: text("trigger_id").notNull(),
    assetId: text("asset_id").notNull(),
    assetType: text("asset_type").notNull(),
    policyVersion: text("policy_version").notNull(),
    actionJson: text("action_json").notNull(),
    reasonCodesJson: text("reason_codes_json").notNull(),
    inputEvidenceIdsJson: text("input_evidence_ids_json").notNull(),
    candidateActionsJson: text("candidate_actions_json").notNull(),
    guardResultsJson: text("guard_results_json").notNull(),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("adaptive_training_decisions_trigger_uq").on(table.triggerKind, table.triggerId),
    uniqueIndex("adaptive_training_decisions_trace_uq").on(table.traceId),
    index("adaptive_training_decisions_asset_idx").on(table.learnerId, table.assetId, table.createdAt),
  ],
);

export const adaptiveRetests = sqliteTable(
  "adaptive_retests",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    assetId: text("asset_id").notNull(),
    assetType: text("asset_type").notNull(),
    sourceDecisionId: text("source_decision_id")
      .notNull()
      .references(() => adaptiveTrainingDecisions.id, { onDelete: "restrict", onUpdate: "cascade" }),
    purpose: text("purpose").notNull(),
    dueAt: text("due_at").notNull(),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("adaptive_retests_decision_uq").on(table.sourceDecisionId),
    index("adaptive_retests_due_idx").on(table.status, table.dueAt),
    index("adaptive_retests_asset_idx").on(table.learnerId, table.assetId, table.dueAt),
  ],
);

export const guidedWritingSessions = sqliteTable(
  "guided_writing_sessions",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    sourceEssayId: text("source_essay_id")
      .notNull()
      .references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    paragraphKey: text("paragraph_key").notNull(),
    taskAnalysisVersion: text("task_analysis_version").notNull(),
    promptSnapshot: text("prompt_snapshot").notNull(),
    questionType: text("question_type").notNull(),
    status: text("status").notNull(),
    currentNode: text("current_node"),
    argumentGraphJson: text("argument_graph_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("guided_writing_sessions_source_idx").on(table.learnerId, table.sourceEssayId, table.updatedAt),
    index("guided_writing_sessions_status_idx").on(table.status, table.updatedAt),
  ],
);

export const guidedWritingPromptAnalyses = sqliteTable(
  "guided_writing_prompt_analyses",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    promptText: text("prompt_text").notNull(),
    promptHash: text("prompt_hash").notNull(),
    status: text("status").notNull(),
    analysisJson: text("analysis_json"),
    traceId: text("trace_id").notNull().references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_prompt_analyses_trace_uq").on(table.traceId),
    index("guided_writing_prompt_analyses_hash_idx").on(table.learnerId, table.promptHash, table.createdAt),
    index("guided_writing_prompt_analyses_status_idx").on(table.status),
  ],
);

export const guidedWritingTurns = sqliteTable(
  "guided_writing_turns",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => guidedWritingSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    node: text("node").notNull(),
    questionEn: text("question_en").notNull(),
    learnerAnswer: text("learner_answer").notNull(),
    origin: text("origin").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    actionJson: text("action_json"),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_turns_trace_uq").on(table.traceId),
    index("guided_writing_turns_session_idx").on(table.sessionId, table.createdAt),
    index("guided_writing_turns_status_idx").on(table.status),
  ],
);

export const guidedWritingParagraphDrafts = sqliteTable(
  "guided_writing_paragraph_drafts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => guidedWritingSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    paragraphKey: text("paragraph_key").notNull(),
    draftText: text("draft_text").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_paragraph_drafts_trace_uq").on(table.traceId),
    index("guided_writing_paragraph_drafts_session_idx").on(table.sessionId, table.createdAt),
    index("guided_writing_paragraph_drafts_status_idx").on(table.status),
  ],
);

export const guidedWritingIntroductionDrafts = sqliteTable(
  "guided_writing_introduction_drafts",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    sourceEssayId: text("source_essay_id")
      .notNull()
      .references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyOneSessionId: text("body_1_session_id")
      .notNull()
      .references(() => guidedWritingSessions.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyTwoSessionId: text("body_2_session_id")
      .notNull()
      .references(() => guidedWritingSessions.id, { onDelete: "restrict", onUpdate: "cascade" }),
    openingText: text("opening_text").notNull(),
    taskFramingText: text("task_framing_text").notNull(),
    thesisText: text("thesis_text").notNull(),
    draftText: text("draft_text").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_introduction_drafts_trace_uq").on(table.traceId),
    index("guided_writing_introduction_drafts_source_idx").on(table.learnerId, table.sourceEssayId, table.createdAt),
    index("guided_writing_introduction_drafts_status_idx").on(table.status),
  ],
);

export const guidedWritingConclusionDrafts = sqliteTable(
  "guided_writing_conclusion_drafts",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    sourceEssayId: text("source_essay_id").notNull().references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    introductionDraftId: text("introduction_draft_id").notNull().references(() => guidedWritingIntroductionDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyOneDraftId: text("body_1_draft_id").notNull().references(() => guidedWritingParagraphDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyTwoDraftId: text("body_2_draft_id").notNull().references(() => guidedWritingParagraphDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    conclusionText: text("conclusion_text").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    traceId: text("trace_id").notNull().references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(), completedAt: text("completed_at"), updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_conclusion_drafts_trace_uq").on(table.traceId),
    index("guided_writing_conclusion_drafts_source_idx").on(table.learnerId, table.sourceEssayId, table.createdAt),
    index("guided_writing_conclusion_drafts_status_idx").on(table.status),
  ],
);

export const guidedWritingFullEssayReviews = sqliteTable(
  "guided_writing_full_essay_reviews",
  {
    id: text("id").primaryKey(), learnerId: text("learner_id").notNull(),
    sourceEssayId: text("source_essay_id").notNull().references(() => sourceEssays.id, { onDelete: "restrict", onUpdate: "cascade" }),
    introductionDraftId: text("introduction_draft_id").notNull().references(() => guidedWritingIntroductionDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyOneDraftId: text("body_1_draft_id").notNull().references(() => guidedWritingParagraphDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bodyTwoDraftId: text("body_2_draft_id").notNull().references(() => guidedWritingParagraphDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    conclusionDraftId: text("conclusion_draft_id").notNull().references(() => guidedWritingConclusionDrafts.id, { onDelete: "restrict", onUpdate: "cascade" }),
    inputHash: text("input_hash").notNull(), status: text("status").notNull(), evaluationJson: text("evaluation_json"),
    traceId: text("trace_id").notNull().references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"), createdAt: text("created_at").notNull(), completedAt: text("completed_at"), updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_full_essay_reviews_trace_uq").on(table.traceId),
    index("guided_writing_full_essay_reviews_source_idx").on(table.learnerId, table.sourceEssayId, table.createdAt),
    index("guided_writing_full_essay_reviews_status_idx").on(table.status),
  ],
);

export const guidedWritingNodeLanguageAttempts = sqliteTable(
  "guided_writing_node_language_attempts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => guidedWritingSessions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    node: text("node").notNull(),
    learnerText: text("learner_text").notNull(),
    assetType: text("asset_type"),
    assetId: text("asset_id"),
    hintLevel: integer("hint_level").notNull(),
    inputHash: text("input_hash").notNull(),
    status: text("status").notNull(),
    evaluationJson: text("evaluation_json"),
    traceId: text("trace_id")
      .notNull()
      .references(() => agentTraces.id, { onDelete: "restrict", onUpdate: "cascade" }),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("guided_writing_node_language_attempts_trace_uq").on(table.traceId),
    index("guided_writing_node_language_attempts_session_node_idx").on(table.sessionId, table.node, table.createdAt),
    index("guided_writing_node_language_attempts_status_idx").on(table.status),
  ],
);

export const databaseSchema = {
  sourceEssays,
  cards,
  candidates,
  cardTopics,
  cardArgumentFunctions,
  attempts,
  reviewStates,
  settings,
  contentImports,
  collocationCandidates,
  collocations,
  collocationTopics,
  collocationArgumentFunctions,
  collocationSourceLinks,
  collocationProgress,
  collocationAttempts,
  collocationImports,
  agentTraces,
  useEvaluationRuns,
  learningEvidence,
  adaptiveTrainingDecisions,
  adaptiveRetests,
  guidedWritingSessions,
  guidedWritingTurns,
  guidedWritingParagraphDrafts,
  guidedWritingIntroductionDrafts,
  guidedWritingConclusionDrafts,
  guidedWritingFullEssayReviews,
  guidedWritingNodeLanguageAttempts,
};
