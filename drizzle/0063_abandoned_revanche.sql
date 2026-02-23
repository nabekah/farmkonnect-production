CREATE TABLE `dataChangeLogs` (
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
	CONSTRAINT `dataChangeLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int,
	`messageId` varchar(255),
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('pending','sent','delivered','bounced','complained','opened','clicked') NOT NULL DEFAULT 'pending',
	`sendTime` timestamp,
	`deliveryTime` timestamp,
	`openTime` timestamp,
	`clickTime` timestamp,
	`bounceType` enum('permanent','temporary'),
	`bounceReason` varchar(255),
	`complaintType` enum('abuse','fraud','not_requested','other'),
	`sendGridEventId` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailAnalytics_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` varchar(500),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailCampaignRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`description` text,
	`recipientCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','scheduled','sending','completed','failed') NOT NULL DEFAULT 'draft',
	`scheduledTime` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` enum('basic','welcome','alert','custom') NOT NULL DEFAULT 'custom',
	`subject` varchar(255) NOT NULL,
	`htmlContent` text NOT NULL,
	`plainTextContent` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `action` enum('approve','reject','suspend','unsuspend','bulk_approve','bulk_reject','bulk_suspend') NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `adminId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `bulkOperationId` varchar(255);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100) DEFAULT null;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255) DEFAULT null;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `entityType`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `entityId`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `oldValues`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `newValues`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `changedFields`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `ipAddress`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP COLUMN `userAgent`;