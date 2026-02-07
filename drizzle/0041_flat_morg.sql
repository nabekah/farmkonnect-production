CREATE TABLE `bulkOperationHistory` (
	`id` varchar(64) NOT NULL,
	`farmId` int NOT NULL,
	`userId` int NOT NULL,
	`operationType` enum('batch-edit','import','export','bulk-register') NOT NULL,
	`status` enum('pending','in-progress','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`totalItems` int NOT NULL,
	`processedItems` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`details` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`duration` int,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulkOperationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operationFailureDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` varchar(64) NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`itemType` varchar(50) NOT NULL,
	`errorCode` varchar(50) NOT NULL,
	`errorMessage` text NOT NULL,
	`itemData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operationFailureDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operationRetryLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` varchar(64) NOT NULL,
	`retryAttempt` int NOT NULL,
	`status` enum('pending','in-progress','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`nextRetryAt` timestamp,
	`backoffMultiplier` decimal(4,2) DEFAULT '1.5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `operationRetryLog_id` PRIMARY KEY(`id`)
);
