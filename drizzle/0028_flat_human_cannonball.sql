CREATE TABLE `reportAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`farmId` int NOT NULL,
	`reportType` enum('financial','livestock','complete') NOT NULL,
	`totalGenerated` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalFailed` int NOT NULL DEFAULT 0,
	`successRate` decimal(5,2) DEFAULT '0.00',
	`averageGenerationTime` int,
	`averageFileSize` int,
	`lastGeneratedAt` timestamp,
	`lastFailedAt` timestamp,
	`lastFailureReason` text,
	`recipientEngagement` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportDeliveryEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportHistoryId` int NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`status` enum('sent','delivered','opened','failed','bounced') NOT NULL,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportDeliveryEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportTemplateFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`fieldName` varchar(255) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`fieldType` enum('text','number','date','currency','percentage','chart') NOT NULL,
	`isVisible` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`aggregationType` enum('sum','average','count','min','max','none') DEFAULT 'none',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportTemplateFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`reportType` enum('financial','livestock','complete') NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`includeSections` text NOT NULL,
	`customBranding` text,
	`dataFilters` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reportAnalytics` ADD CONSTRAINT `reportAnalytics_scheduleId_reportSchedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `reportSchedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportAnalytics` ADD CONSTRAINT `reportAnalytics_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportDeliveryEvents` ADD CONSTRAINT `reportDeliveryEvents_reportHistoryId_reportHistory_id_fk` FOREIGN KEY (`reportHistoryId`) REFERENCES `reportHistory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportTemplateFields` ADD CONSTRAINT `reportTemplateFields_templateId_reportTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `reportTemplates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportTemplates` ADD CONSTRAINT `reportTemplates_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE no action ON UPDATE no action;