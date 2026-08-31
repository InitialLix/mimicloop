CREATE TABLE `guided_writing_node_language_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`node` text NOT NULL,
	`learner_text` text NOT NULL,
	`asset_type` text,
	`asset_id` text,
	`hint_level` integer NOT NULL,
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
CREATE UNIQUE INDEX `guided_writing_node_language_attempts_trace_uq` ON `guided_writing_node_language_attempts` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_node_language_attempts_session_node_idx` ON `guided_writing_node_language_attempts` (`session_id`,`node`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_node_language_attempts_status_idx` ON `guided_writing_node_language_attempts` (`status`);
