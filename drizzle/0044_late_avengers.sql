CREATE TABLE `breedingCalculators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesId` int NOT NULL,
	`breedId` int,
	`calculatorName` varchar(255) NOT NULL,
	`description` text,
	`calculationType` enum('inbreeding','expectedProgeny','geneticValue','heterosis') NOT NULL,
	`formula` text,
	`parameters` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `breedingCalculators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesId` int NOT NULL,
	`breedName` varchar(255) NOT NULL,
	`breedCode` varchar(50),
	`origin` varchar(255),
	`description` text,
	`characteristics` text,
	`productionCapabilities` text,
	`adaptability` varchar(100),
	`rarity` enum('common','uncommon','rare','endangered') DEFAULT 'common',
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breeds_id` PRIMARY KEY(`id`),
	CONSTRAINT `breeds_breedCode_unique` UNIQUE(`breedCode`)
);
--> statement-breakpoint
CREATE TABLE `feedRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesId` int NOT NULL,
	`breedId` int,
	`ageGroup` varchar(100) NOT NULL,
	`productionStage` varchar(100),
	`feedType` varchar(255) NOT NULL,
	`dailyQuantityKg` decimal(8,2),
	`proteinPercentage` decimal(5,2),
	`energyMcalKg` decimal(8,2),
	`fiberPercentage` decimal(5,2),
	`fatPercentage` decimal(5,2),
	`calciumPercentage` decimal(5,2),
	`phosphorusPercentage` decimal(5,2),
	`ingredients` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthProtocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesId` int NOT NULL,
	`protocolName` varchar(255) NOT NULL,
	`description` text,
	`protocolType` enum('vaccination','treatment','prevention','monitoring') NOT NULL,
	`recommendedAge` varchar(100),
	`frequency` varchar(100),
	`disease` varchar(255),
	`vaccine` varchar(255),
	`dosage` varchar(255),
	`administrationRoute` varchar(100),
	`sideEffects` text,
	`contraindications` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `healthProtocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productionMetricsTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesId` int NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`metricType` enum('milk','eggs','wool','meat','fiber','reproduction','other') NOT NULL,
	`unit` varchar(100) NOT NULL,
	`benchmarkMin` decimal(8,2),
	`benchmarkAverage` decimal(8,2),
	`benchmarkMax` decimal(8,2),
	`frequency` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productionMetricsTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `speciesAnimalRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`speciesId` int NOT NULL,
	`breedId` int,
	`productionType` varchar(100),
	`registrationNumber` varchar(255),
	`pedigree` text,
	`geneticMarkers` text,
	`currentWeight` decimal(8,2),
	`lastWeightDate` date,
	`bodyConditionScore` decimal(3,1),
	`reproductiveStatus` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `speciesAnimalRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `speciesAnimalRecords_animalId_unique` UNIQUE(`animalId`)
);
--> statement-breakpoint
CREATE TABLE `speciesProductionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`metricTemplateId` int NOT NULL,
	`recordDate` date NOT NULL,
	`value` decimal(8,2) NOT NULL,
	`unit` varchar(100) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `speciesProductionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `speciesTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`speciesName` varchar(100) NOT NULL,
	`commonNames` varchar(500),
	`description` text,
	`icon` varchar(100),
	`averageLifespanYears` int,
	`matureWeightKg` decimal(8,2),
	`productionType` varchar(100),
	`gestationPeriodDays` int,
	`averageLitterSize` int,
	`sexualMaturityMonths` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `speciesTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `speciesTemplates_speciesName_unique` UNIQUE(`speciesName`)
);
