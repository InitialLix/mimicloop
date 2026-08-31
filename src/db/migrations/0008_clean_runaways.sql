CREATE TABLE `learning_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`dimension` text NOT NULL,
	`outcome` text NOT NULL,
	`context_json` text NOT NULL,
	`evaluator_json` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_id` text NOT NULL,
	`evidence_version` text NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_evidence_source_dimension_uq` ON `learning_evidence` (`source_kind`,`source_id`,`dimension`);--> statement-breakpoint
CREATE INDEX `learning_evidence_learner_asset_idx` ON `learning_evidence` (`learner_id`,`asset_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `learning_evidence_dimension_idx` ON `learning_evidence` (`dimension`,`outcome`);