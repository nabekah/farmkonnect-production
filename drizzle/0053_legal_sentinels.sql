CREATE TABLE `budgetAlertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetAlertId` int NOT NULL,
	`alertLevel` enum('warning','critical') NOT NULL,
	`percentageUsed` decimal(5,2) NOT NULL,
	`amountUsed` decimal(12,2) NOT NULL,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`notificationMethod` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgetAlertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`farmId` int NOT NULL,
	`expenseType` varchar(100) NOT NULL,
	`budgetedAmount` decimal(12,2) NOT NULL,
	`actualAmount` decimal(12,2) DEFAULT 0,
	`thresholdPercentage` decimal(5,2) DEFAULT 80,
	`alertTriggered` boolean NOT NULL DEFAULT false,
	`alertTriggeredAt` timestamp,
	`alertRead` boolean NOT NULL DEFAULT false,
	`alertReadAt` timestamp,
	`alertMessage` text,
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurringTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`transactionType` enum('expense','revenue') NOT NULL,
	`expenseType` varchar(100),
	`revenueType` varchar(100),
	`description` varchar(500) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly','quarterly','yearly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`month` int,
	`startDate` date NOT NULL,
	`endDate` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastGeneratedDate` date,
	`nextGenerationDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringTransactions_id` PRIMARY KEY(`id`)
);
