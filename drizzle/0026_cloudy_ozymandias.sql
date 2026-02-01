ALTER TABLE `alertHistory` ADD `isAcknowledged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD `acknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD `acknowledgedBy` int;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD `actionTaken` text;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD `responseTimeMinutes` int;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;