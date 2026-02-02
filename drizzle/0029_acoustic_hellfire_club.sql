CREATE TABLE `groupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`role` varchar(50),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipientGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipientGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportArchival` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportHistoryId` int NOT NULL,
	`farmId` int NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` text NOT NULL,
	`archivedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`retentionDays` int,
	`isRestored` boolean NOT NULL DEFAULT false,
	`restoredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportArchival_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExportLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportHistoryId` int NOT NULL,
	`farmId` int NOT NULL,
	`exportedBy` int NOT NULL,
	`exportFormat` enum('pdf','excel','csv') NOT NULL,
	`downloadUrl` text,
	`expiresAt` timestamp,
	`downloadCount` int NOT NULL DEFAULT 0,
	`lastDownloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExportLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `groupMembers` ADD CONSTRAINT `groupMembers_groupId_recipientGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `recipientGroups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipientGroups` ADD CONSTRAINT `recipientGroups_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportArchival` ADD CONSTRAINT `reportArchival_reportHistoryId_reportHistory_id_fk` FOREIGN KEY (`reportHistoryId`) REFERENCES `reportHistory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportArchival` ADD CONSTRAINT `reportArchival_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportExportLog` ADD CONSTRAINT `reportExportLog_reportHistoryId_reportHistory_id_fk` FOREIGN KEY (`reportHistoryId`) REFERENCES `reportHistory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportExportLog` ADD CONSTRAINT `reportExportLog_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportExportLog` ADD CONSTRAINT `reportExportLog_exportedBy_users_id_fk` FOREIGN KEY (`exportedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;