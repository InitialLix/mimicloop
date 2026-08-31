CREATE TABLE `adaptive_retests` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`source_decision_id` text NOT NULL,
	`purpose` text NOT NULL,
	`due_at` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_decision_id`) REFERENCES `adaptive_training_decisions`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adaptive_retests_decision_uq` ON `adaptive_retests` (`source_decision_id`);--> statement-breakpoint
CREATE INDEX `adaptive_retests_due_idx` ON `adaptive_retests` (`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `adaptive_retests_asset_idx` ON `adaptive_retests` (`learner_id`,`asset_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `adaptive_training_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`trigger_kind` text NOT NULL,
	`trigger_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`policy_version` text NOT NULL,
	`action_json` text NOT NULL,
	`reason_codes_json` text NOT NULL,
	`input_evidence_ids_json` text NOT NULL,
	`candidate_actions_json` text NOT NULL,
	`guard_results_json` text NOT NULL,
	`trace_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`trace_id`) REFERENCES `agent_traces`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adaptive_training_decisions_trigger_uq` ON `adaptive_training_decisions` (`trigger_kind`,`trigger_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `adaptive_training_decisions_trace_uq` ON `adaptive_training_decisions` (`trace_id`);--> statement-breakpoint
CREATE INDEX `adaptive_training_decisions_asset_idx` ON `adaptive_training_decisions` (`learner_id`,`asset_id`,`created_at`);