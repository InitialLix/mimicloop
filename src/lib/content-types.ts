export interface Chunk {
  text: string;
  meaning_zh: string;
  note: string;
}

export interface Gloss {
  text: string;
  lemma: string;
  part_of_speech: string;
  meaning_zh: string;
  note: string;
  occurrence_index: number;
}

export interface Slot {
  name: string;
  role_zh: string;
  original_value: string;
  replacement_examples: string[];
}

export interface SentenceCardData {
  schema_version: string;
  id: string;
  source_essay_id: string;
  original_sentence: string;
  learning_sentence: string;
  learning_edits: Array<{
    edit_type: "formatting_cleanup" | "expand_abbreviation" | "resolve_reference";
    before: string;
    after: string;
    reason: string;
  }>;
  translation_zh: string;
  context_before: string;
  context_after: string;
  paragraph_index: number;
  sentence_index: number;
  task: "academic_task_2";
  question_types: string[];
  topics: string[];
  argument_functions: string[];
  primary_focus: "vocabulary" | "structure" | "mixed";
  chunks: Chunk[];
  glosses: Gloss[];
  pattern: string | null;
  slots: Slot[];
  grammar_note: string | null;
  usage_note: string | null;
  simplified_version: string | null;
  transfer_example: string | null;
  exercise_seed: {
    chunk_cloze?: Array<{
      chunk_text: string;
      prompt_sentence: string;
      reference_answer: string;
    }>;
    translation_recall?: {
      prompt_zh: string;
      reference_answer: string;
    };
    slot_replacement?: Array<{
      prompt_zh: string;
      hints?: Array<{
        zh: string;
        en: string;
      }>;
      feedback_pattern?: string;
      slot_values: Array<{
        slot_name: string;
        value: string;
      }>;
      reference_answer: string;
    }>;
    guided_application?: {
      prompt_zh: string;
      hints: Array<{
        zh: string;
        en: string;
      }>;
      target_chunk: string;
      reference_answer: string;
    };
  };
  difficulty: number;
  transfer_value: number;
  source_reliability: string;
  content_status: string;
  content_revision: number;
  normalized_text_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SourceEssayData {
  id: string;
  title: string;
  ielts_prompt: string | null;
  full_text: string;
  paragraphs: Array<{
    paragraph_index: number;
    text: string;
    content_hash: string;
  }>;
  source_name: string;
  content_role?: "ielts_model_essay" | "language_richness_corpus" | "guided_writing_prompt";
  source_type: string;
  answer_origin: string;
  source_url: string | null;
  publication_ref: string | null;
  author: string;
  question_type: string;
  topics: string[];
  claimed_band: string | null;
  examiner_comments: string | null;
  local_raw_file: string;
  rights_note: string;
}

export interface CandidateData {
  candidate_id: string;
  card: SentenceCardData;
  source_match: {
    match_type: "exact" | "normalized_formatting" | "unverified";
    matched_text: string;
    paragraph_index: number;
    sentence_index: number;
  };
  selection_scores: {
    naturalness: number;
    context_independence: number;
    vocabulary_value: number;
    structure_value: number;
    transfer_value: number;
  };
  workflow_status: "candidate" | "needs_edit" | "approved" | "deferred" | "rejected";
  priority: "core" | "supporting";
  recommendation_reasons: string[];
  uncertainties: string[];
  review_history: Array<{
    action: string;
    reviewer: string;
    reason: string;
    reviewed_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CandidateReviewFields {
  translationZh: string;
  chunks: Chunk[];
  pattern: string | null;
  slots: Slot[];
  grammarNote: string | null;
  usageNote: string | null;
  simplifiedVersion: string | null;
  transferExample: string | null;
  exerciseSeed: SentenceCardData["exercise_seed"];
  uncertainties: string[];
}

export type CandidateReviewAction = "save" | "approve" | "defer" | "reject";

export interface CollocationSlot {
  name: string;
  role_zh: string;
  replacement_examples: string[];
}

export interface CollocationSourceLink {
  source_essay_id: string;
  paragraph_index: number;
  sentence_index: number;
  sentence_text: string;
  card_id: string | null;
  surface_form: string;
  learning_surface_form: string | null;
  occurrence_index: number;
  learning_occurrence_index: number | null;
  role: "primary" | "supporting";
}

export type CollocationWorkflowStatus =
  | "candidate"
  | "needs_edit"
  | "approved"
  | "deferred"
  | "rejected"
  | "merged"
  | "archived";

export interface CollocationData {
  schema_version: "1.2.0";
  id: string;
  canonical_text: string;
  translation_prompt: string;
  pattern: string | null;
  slots: CollocationSlot[];
  expression_type: "collocation" | "fixed_phrase" | "sentence_frame";
  grammar_pattern: string | null;
  usage_note: string | null;
  common_error: string | null;
  accepted_answers: string[];
  exercise_seed: {
    guided_application?: {
      prompt_zh: string;
      hints: Array<{ zh: string; en: string }>;
      target_surface: string;
      reference_answer: string;
      transfer_type: "slot_replacement" | "cross_topic";
    };
  };
  topics: string[];
  argument_functions: string[];
  source_links: CollocationSourceLink[];
  selection_scores: {
    naturalness: number;
    active_recall_value: number;
    transfer_value: number;
    ielts_usefulness: number;
  };
  difficulty: number;
  normalized_text_hash: string;
  deduplication: {
    group_key: string;
    merge_target_id: string | null;
    confidence: "high" | "medium" | "low";
    note: string | null;
  };
  recommendation_reasons: string[];
  uncertainties: string[];
  workflow_status: CollocationWorkflowStatus;
  learning_mode: "recall_use" | "appreciation";
  priority: "core" | "supporting";
  provenance: {
    guideline_version: "1.2.0";
    prompt_version: string;
    processor_type: "codex" | "manual" | "external_llm";
    model_id: string | null;
  };
  review_history: Array<{
    action: string;
    reviewer: string;
    reason: string;
    reviewed_at: string;
  }>;
  content_revision: number;
  created_at: string;
  updated_at: string;
}

export interface CollocationReviewFields {
  canonicalText: string;
  translationPrompt: string;
  pattern: string | null;
  slots: CollocationSlot[];
  expressionType: CollocationData["expression_type"];
  grammarPattern: string | null;
  usageNote: string | null;
  commonError: string | null;
  acceptedAnswers: string[];
  topics: string[];
  argumentFunctions: string[];
  uncertainties: string[];
}

export type CollocationReviewAction = "save" | "approve" | "defer" | "reject" | "merge";

export interface CollocationProgressData {
  collocationId: string;
  learningStage: "new" | "learned" | "recall" | "use";
  recallScore: number | null;
  applicationScore: number | null;
  successStreak: number;
  lapseCount: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt: string | null;
  updatedAt: string;
}
