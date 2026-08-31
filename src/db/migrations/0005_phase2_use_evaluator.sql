CREATE TABLE `agent_traces` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id_hash` text NOT NULL,
	`feature` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`steps_json` text NOT NULL,
	`provider` text,
	`model` text,
	`prompt_version` text NOT NULL,
	`schema_version` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`error_codes_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_traces_feature_started_idx` ON `agent_traces` (`feature`,`started_at`);--> statement-breakpoint
CREATE INDEX `agent_traces_status_idx` ON `agent_traces` (`status`);--> statement-breakpoint
CREATE TABLE `use_evaluation_runs` (
	`attempt_id` text PRIMARY KEY NOT NULL,
	`exercise_ref` text NOT NULL,
	`exercise_kind` text NOT NULL,
	`asset_id` text NOT NULL,
	`asset_revision` integer NOT NULL,
	`input_hash` text NOT NULL,
	`learner_answer` text NOT NULL,
	`status` text NOT NULL,
	`evaluation_json` text,
	`feedback_json` text,
	`trace_id` text NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `use_evaluation_runs_trace_uq` ON `use_evaluation_runs` (`trace_id`);--> statement-breakpoint
CREATE INDEX `use_evaluation_runs_asset_idx` ON `use_evaluation_runs` (`exercise_kind`,`asset_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `use_evaluation_runs_status_idx` ON `use_evaluation_runs` (`status`);
