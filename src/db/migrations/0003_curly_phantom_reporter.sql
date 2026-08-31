CREATE TABLE `collocation_argument_functions` (
	`collocation_id` text NOT NULL,
	`argument_function` text NOT NULL,
	PRIMARY KEY(`collocation_id`, `argument_function`),
	FOREIGN KEY (`collocation_id`) REFERENCES `collocations`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collocation_argument_functions_value_idx` ON `collocation_argument_functions` (`argument_function`);--> statement-breakpoint
CREATE TABLE `collocation_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`collocation_id` text NOT NULL,
	`exercise_type` text NOT NULL,
	`prompt_snapshot` text NOT NULL,
	`user_answer` text NOT NULL,
	`normalized_answer` text NOT NULL,
	`match_result` text NOT NULL,
	`self_rating` text NOT NULL,
	`hint_used` integer NOT NULL,
	`attempt_count` integer NOT NULL,
	`duration_ms` integer,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`collocation_id`) REFERENCES `collocations`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collocation_attempts_item_completed_idx` ON `collocation_attempts` (`collocation_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `collocation_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_status` text NOT NULL,
	`priority` text NOT NULL,
	`normalized_text_hash` text NOT NULL,
	`dedup_group_key` text NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `collocation_candidates_status_idx` ON `collocation_candidates` (`workflow_status`);--> statement-breakpoint
CREATE INDEX `collocation_candidates_hash_idx` ON `collocation_candidates` (`normalized_text_hash`);--> statement-breakpoint
CREATE INDEX `collocation_candidates_group_idx` ON `collocation_candidates` (`dedup_group_key`);--> statement-breakpoint
CREATE TABLE `collocation_imports` (
	`import_hash` text PRIMARY KEY NOT NULL,
	`candidate_count` integer NOT NULL,
	`approved_count` integer NOT NULL,
	`relation_count` integer NOT NULL,
	`imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collocation_progress` (
	`collocation_id` text PRIMARY KEY NOT NULL,
	`learning_stage` text NOT NULL,
	`recall_score` real,
	`application_score` real,
	`success_streak` integer DEFAULT 0 NOT NULL,
	`lapse_count` integer DEFAULT 0 NOT NULL,
	`interval_days` real DEFAULT 0 NOT NULL,
	`due_at` text NOT NULL,
	`last_reviewed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`collocation_id`) REFERENCES `collocations`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collocation_source_links` (
	`collocation_id` text NOT NULL,
	`source_essay_id` text NOT NULL,
	`paragraph_index` integer NOT NULL,
	`sentence_index` integer NOT NULL,
	`sentence_text` text NOT NULL,
	`card_id` text,
	`surface_form` text NOT NULL,
	`learning_surface_form` text,
	`occurrence_index` integer NOT NULL,
	`learning_occurrence_index` integer,
	`start_offset` integer,
	`end_offset` integer,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`collocation_id`, `source_essay_id`, `paragraph_index`, `sentence_index`, `surface_form`, `occurrence_index`),
	FOREIGN KEY (`collocation_id`) REFERENCES `collocations`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `collocation_source_links_collocation_idx` ON `collocation_source_links` (`collocation_id`);--> statement-breakpoint
CREATE INDEX `collocation_source_links_source_idx` ON `collocation_source_links` (`source_essay_id`);--> statement-breakpoint
CREATE INDEX `collocation_source_links_card_idx` ON `collocation_source_links` (`card_id`);--> statement-breakpoint
CREATE TABLE `collocation_topics` (
	`collocation_id` text NOT NULL,
	`topic` text NOT NULL,
	PRIMARY KEY(`collocation_id`, `topic`),
	FOREIGN KEY (`collocation_id`) REFERENCES `collocations`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collocation_topics_topic_idx` ON `collocation_topics` (`topic`);--> statement-breakpoint
CREATE TABLE `collocations` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_text` text NOT NULL,
	`translation_prompt` text NOT NULL,
	`pattern` text,
	`expression_type` text NOT NULL,
	`difficulty` integer NOT NULL,
	`content_status` text NOT NULL,
	`content_revision` integer NOT NULL,
	`normalized_text_hash` text NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collocations_normalized_text_hash_uq` ON `collocations` (`normalized_text_hash`);--> statement-breakpoint
CREATE INDEX `collocations_status_idx` ON `collocations` (`content_status`);