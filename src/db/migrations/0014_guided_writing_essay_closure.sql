CREATE TABLE `guided_writing_conclusion_drafts` (
  `id` text PRIMARY KEY NOT NULL, `learner_id` text NOT NULL, `source_essay_id` text NOT NULL,
  `introduction_draft_id` text NOT NULL, `body_1_draft_id` text NOT NULL, `body_2_draft_id` text NOT NULL,
  `conclusion_text` text NOT NULL, `input_hash` text NOT NULL, `status` text NOT NULL,
  `evaluation_json` text, `trace_id` text NOT NULL, `error_code` text,
  `created_at` text NOT NULL, `completed_at` text, `updated_at` text NOT NULL,
  FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`introduction_draft_id`) REFERENCES `guided_writing_introduction_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`body_1_draft_id`) REFERENCES `guided_writing_paragraph_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`body_2_draft_id`) REFERENCES `guided_writing_paragraph_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_conclusion_drafts_trace_uq` ON `guided_writing_conclusion_drafts` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_conclusion_drafts_source_idx` ON `guided_writing_conclusion_drafts` (`learner_id`,`source_essay_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_conclusion_drafts_status_idx` ON `guided_writing_conclusion_drafts` (`status`);--> statement-breakpoint
CREATE TABLE `guided_writing_full_essay_reviews` (
  `id` text PRIMARY KEY NOT NULL, `learner_id` text NOT NULL, `source_essay_id` text NOT NULL,
  `introduction_draft_id` text NOT NULL, `body_1_draft_id` text NOT NULL, `body_2_draft_id` text NOT NULL,
  `conclusion_draft_id` text NOT NULL, `input_hash` text NOT NULL, `status` text NOT NULL,
  `evaluation_json` text, `trace_id` text NOT NULL, `error_code` text,
  `created_at` text NOT NULL, `completed_at` text, `updated_at` text NOT NULL,
  FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`introduction_draft_id`) REFERENCES `guided_writing_introduction_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`body_1_draft_id`) REFERENCES `guided_writing_paragraph_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`body_2_draft_id`) REFERENCES `guided_writing_paragraph_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`conclusion_draft_id`) REFERENCES `guided_writing_conclusion_drafts`(`id`) ON UPDATE cascade ON DELETE restrict,
  FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_full_essay_reviews_trace_uq` ON `guided_writing_full_essay_reviews` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_full_essay_reviews_source_idx` ON `guided_writing_full_essay_reviews` (`learner_id`,`source_essay_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_full_essay_reviews_status_idx` ON `guided_writing_full_essay_reviews` (`status`);
