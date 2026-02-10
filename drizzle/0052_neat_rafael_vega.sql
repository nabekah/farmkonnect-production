CREATE TABLE `animalProfitability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalTypeId` int NOT NULL,
	`animalType` varchar(100) NOT NULL,
	`period` varchar(20) NOT NULL,
	`totalAnimals` int NOT NULL,
	`totalRevenue` decimal(12,2) NOT NULL,
	`totalExpenses` decimal(12,2) NOT NULL,
	`netProfit` decimal(12,2) NOT NULL,
	`profitMargin` decimal(5,2) NOT NULL,
	`revenuePerAnimal` decimal(12,2) NOT NULL,
	`costPerAnimal` decimal(12,2) NOT NULL,
	`roi` decimal(5,2),
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `animalProfitability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetVarianceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetLineItemId` int NOT NULL,
	`farmId` int NOT NULL,
	`varianceAmount` decimal(12,2) NOT NULL,
	`variancePercentage` decimal(5,2) NOT NULL,
	`alertType` enum('over_budget','approaching_budget','under_budget') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetVarianceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenseReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expenseId` int NOT NULL,
	`farmId` int NOT NULL,
	`receiptUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(50),
	`extractedAmount` decimal(12,2),
	`extractedDate` date,
	`extractedVendor` varchar(255),
	`extractedDescription` text,
	`ocrConfidence` decimal(5,2),
	`ocrProcessed` boolean NOT NULL DEFAULT false,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenseReceipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`forecastType` enum('revenue','expense','profit') NOT NULL,
	`category` varchar(100),
	`forecastPeriod` varchar(20) NOT NULL,
	`historicalAverage` decimal(12,2) NOT NULL,
	`forecastedAmount` decimal(12,2) NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`trend` enum('increasing','decreasing','stable') NOT NULL,
	`trendPercentage` decimal(5,2),
	`dataPointsUsed` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialForecasts_id` PRIMARY KEY(`id`)
);
