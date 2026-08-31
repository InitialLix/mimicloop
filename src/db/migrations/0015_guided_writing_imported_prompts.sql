CREATE TABLE `guided_writing_prompt_analyses` (
  `id` text PRIMARY KEY NOT NULL,
  `learner_id` text NOT NULL,
  `prompt_text` text NOT NULL,
  `prompt_hash` text NOT NULL,
  `status` text NOT NULL,
  `analysis_json` text,
  `trace_id` text NOT NULL,
  `error_code` text,
  `created_at` text NOT NULL,
  `completed_at` text,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guided_writing_prompt_analyses_trace_uq` ON `guided_writing_prompt_analyses` (`trace_id`);--> statement-breakpoint
CREATE INDEX `guided_writing_prompt_analyses_hash_idx` ON `guided_writing_prompt_analyses` (`learner_id`,`prompt_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `guided_writing_prompt_analyses_status_idx` ON `guided_writing_prompt_analyses` (`status`);
