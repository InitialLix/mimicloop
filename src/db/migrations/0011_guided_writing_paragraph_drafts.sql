CREATE TABLE `guided_writing_paragraph_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`paragraph_key` text NOT NULL,
	`draft_text` text NOT NULL,
	`input_hash` text NOT NULL,
	`status` text NOT NULL,
	`evaluation_json` text,
	`trace_id` text NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `guided_writing_sessions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_paragraph_drafts_trace_uq` ON `guided_writing_paragraph_drafts` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_paragraph_drafts_session_idx` ON `guided_writing_paragraph_drafts` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_paragraph_drafts_status_idx` ON `guided_writing_paragraph_drafts` (`status`);