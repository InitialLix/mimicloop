ALTER TABLE `use_evaluation_runs` ADD `previous_attempt_id` text;--> statement-breakpoint
ALTER TABLE `use_evaluation_runs` ADD `retry_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `use_evaluation_runs` ADD `teaching_action_json` text;--> statement-breakpoint
CREATE INDEX `use_evaluation_runs_previous_attempt_idx` ON `use_evaluation_runs` (`previous_attempt_id`);