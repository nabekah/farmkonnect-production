CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`alertType` enum('health','water_quality','weather','maintenance','other') NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alertHistory` ADD CONSTRAINT `alertHistory_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;