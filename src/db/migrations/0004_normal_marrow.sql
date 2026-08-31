ALTER TABLE `collocation_candidates` ADD `learning_mode` text DEFAULT 'recall_use' NOT NULL;--> statement-breakpoint
ALTER TABLE `collocations` ADD `learning_mode` text DEFAULT 'recall_use' NOT NULL;--> statement-breakpoint
CREATE INDEX `collocations_learning_mode_idx` ON `collocations` (`learning_mode`);