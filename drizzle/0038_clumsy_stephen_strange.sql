CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete','import','export') NOT NULL,
	`oldValues` text,
	`newValues` text,
	`changedFields` text,
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkImportJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`totalRecords` int NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorLog` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkImportJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `bulkImportJobs_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `validationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`ruleType` enum('required','min','max','pattern','enum','custom') NOT NULL,
	`ruleValue` text,
	`errorMessage` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `validationRules_id` PRIMARY KEY(`id`)
);
