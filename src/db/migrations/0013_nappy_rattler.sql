CREATE TABLE `guided_writing_introduction_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`source_essay_id` text NOT NULL,
	`body_1_session_id` text NOT NULL,
	`body_2_session_id` text NOT NULL,
	`opening_text` text NOT NULL,
	`task_framing_text` text NOT NULL,
	`thesis_text` text NOT NULL,
	`draft_text` text NOT NULL,
	`input_hash` text NOT NULL,
	`status` text NOT NULL,
	`evaluation_json` text,
	`trace_id` text NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`body_1_session_id`) REFERENCES `guided_writing_sessions`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`body_2_session_id`) REFERENCES `guided_writing_sessions`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_introduction_drafts_trace_uq` ON `guided_writing_introduction_drafts` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_introduction_drafts_source_idx` ON `guided_writing_introduction_drafts` (`learner_id`,`source_essay_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_introduction_drafts_status_idx` ON `guided_writing_introduction_drafts` (`status`);
