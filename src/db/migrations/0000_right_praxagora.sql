CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`exercise_type` text NOT NULL,
	`prompt_snapshot` text NOT NULL,
	`user_answer` text NOT NULL,
	`self_rating` text NOT NULL,
	`hint_used` integer NOT NULL,
	`attempt_count` integer NOT NULL,
	`duration_ms` integer,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempts_card_completed_idx` ON `attempts` (`card_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `candidates` (
	`candidate_id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`source_essay_id` text NOT NULL,
	`workflow_status` text NOT NULL,
	`priority` text NOT NULL,
	`normalized_text_hash` text NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_card_id_uq` ON `candidates` (`card_id`);--> statement-breakpoint
CREATE INDEX `candidates_status_idx` ON `candidates` (`workflow_status`);--> statement-breakpoint
CREATE TABLE `card_argument_functions` (
	`card_id` text NOT NULL,
	`argument_function` text NOT NULL,
	PRIMARY KEY(`card_id`, `argument_function`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_argument_functions_value_idx` ON `card_argument_functions` (`argument_function`);--> statement-breakpoint
CREATE TABLE `card_topics` (
	`card_id` text NOT NULL,
	`topic` text NOT NULL,
	PRIMARY KEY(`card_id`, `topic`),
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_topics_topic_idx` ON `card_topics` (`topic`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`source_essay_id` text NOT NULL,
	`original_sentence` text NOT NULL,
	`learning_sentence` text NOT NULL,
	`translation_zh` text NOT NULL,
	`paragraph_index` integer NOT NULL,
	`sentence_index` integer NOT NULL,
	`task` text NOT NULL,
	`primary_focus` text NOT NULL,
	`difficulty` integer NOT NULL,
	`transfer_value` integer NOT NULL,
	`source_reliability` text NOT NULL,
	`content_status` text NOT NULL,
	`content_revision` integer NOT NULL,
	`normalized_text_hash` text NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_essay_id`) REFERENCES `source_essays`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cards_normalized_text_hash_uq` ON `cards` (`normalized_text_hash`);--> statement-breakpoint
CREATE INDEX `cards_source_essay_idx` ON `cards` (`source_essay_id`);--> statement-breakpoint
CREATE INDEX `cards_status_idx` ON `cards` (`content_status`);--> statement-breakpoint
CREATE TABLE `content_imports` (
	`import_hash` text PRIMARY KEY NOT NULL,
	`source_count` integer NOT NULL,
	`candidate_count` integer NOT NULL,
	`approved_card_count` integer NOT NULL,
	`imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_states` (
	`card_id` text PRIMARY KEY NOT NULL,
	`learning_stage` text NOT NULL,
	`success_streak` integer DEFAULT 0 NOT NULL,
	`interval_days` real DEFAULT 0 NOT NULL,
	`due_at` text NOT NULL,
	`last_reviewed_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_essays` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source_name` text NOT NULL,
	`source_type` text NOT NULL,
	`answer_origin` text NOT NULL,
	`author` text NOT NULL,
	`question_type` text NOT NULL,
	`content_hash` text NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_essays_content_hash_uq` ON `source_essays` (`content_hash`);