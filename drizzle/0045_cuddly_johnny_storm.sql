CREATE TABLE `budgetLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`expenseType` varchar(100) NOT NULL,
	`description` varchar(500),
	`budgetedAmount` decimal(12,2) NOT NULL,
	`actualAmount` decimal(12,2),
	`variance` decimal(12,2),
	`percentageUsed` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`budgetName` varchar(255) NOT NULL,
	`budgetType` enum('annual','quarterly','monthly','project') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalBudget` decimal(12,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`status` enum('draft','approved','active','completed') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int,
	`cropId` int,
	`expenseType` enum('feed','medication','labor','equipment','utilities','transport','veterinary','fertilizer','seeds','pesticides','water','rent','insurance','maintenance','other') NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`quantity` decimal(10,2),
	`unitCost` decimal(10,2),
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`vendor` varchar(255),
	`invoiceNumber` varchar(100),
	`paymentStatus` enum('pending','paid','partial') NOT NULL DEFAULT 'pending',
	`paymentDate` date,
	`expenseDate` date NOT NULL,
	`notes` text,
	`attachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`totalExpenses` decimal(12,2) NOT NULL,
	`totalRevenue` decimal(12,2) NOT NULL,
	`netProfit` decimal(12,2) NOT NULL,
	`profitMargin` decimal(5,2),
	`roi` decimal(5,2),
	`costPerHectare` decimal(10,2),
	`revenuePerHectare` decimal(10,2),
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialSummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`lineTotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`invoiceType` enum('expense','revenue') NOT NULL,
	`vendorOrBuyer` varchar(255) NOT NULL,
	`invoiceDate` date NOT NULL,
	`dueDate` date,
	`totalAmount` decimal(12,2) NOT NULL,
	`paidAmount` decimal(12,2) DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`paymentStatus` enum('draft','sent','pending','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`paymentMethod` varchar(100),
	`notes` text,
	`attachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `revenue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`animalId` int,
	`cropId` int,
	`revenueType` enum('animal_sale','milk_production','egg_production','wool_production','meat_sale','crop_sale','produce_sale','breeding_service','other') NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`quantity` decimal(10,2),
	`unitPrice` decimal(10,2),
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`buyer` varchar(255),
	`invoiceNumber` varchar(100),
	`paymentStatus` enum('pending','paid','partial') NOT NULL DEFAULT 'pending',
	`paymentDate` date,
	`revenueDate` date NOT NULL,
	`notes` text,
	`attachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`taxYear` int NOT NULL,
	`totalIncome` decimal(12,2) NOT NULL,
	`totalExpenses` decimal(12,2) NOT NULL,
	`taxableIncome` decimal(12,2) NOT NULL,
	`taxRate` decimal(5,2),
	`taxAmount` decimal(12,2),
	`currency` varchar(3) NOT NULL DEFAULT 'GHS',
	`status` enum('draft','filed','paid','pending') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxRecords_id` PRIMARY KEY(`id`)
);
