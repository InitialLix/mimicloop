CREATE TABLE `guided_writing_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`source_essay_id` text NOT NULL,
	`paragraph_key` text NOT NULL,
	`task_analysis_version` text NOT NULL,
	`prompt_snapshot` text NOT NULL,
	`question_type` text NOT NULL,
	`status` text NOT NULL,
	`current_node` text,
	`argument_graph_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `guided_writing_sessions_source_idx` ON `guided_writing_sessions` (`learner_id`,`source_essay_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_sessions_status_idx` ON `guided_writing_sessions` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `guided_writing_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`node` text NOT NULL,
	`question_en` text NOT NULL,
	`learner_answer` text NOT NULL,
	`origin` text NOT NULL,
	`input_hash` text NOT NULL,
	`status` text NOT NULL,
	`evaluation_json` text,
	`action_json` text,
	`trace_id` text NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `guided_writing_sessions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_turns_trace_uq` ON `guided_writing_turns` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_turns_session_idx` ON `guided_writing_turns` (`session_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_turns_status_idx` ON `guided_writing_turns` (`status`);