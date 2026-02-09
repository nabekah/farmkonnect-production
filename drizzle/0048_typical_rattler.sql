CREATE TABLE `breedingAnalyticsSummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`reportDate` date NOT NULL,
	`totalBreedingAnimals` int DEFAULT 0,
	`totalOffspringThisYear` int DEFAULT 0,
	`averageGeneticScore` decimal(5,2),
	`geneticDiversity` decimal(5,2),
	`inbreedingTrend` varchar(50),
	`recommendedBreedingPairs` int DEFAULT 0,
	`highRiskPairs` int DEFAULT 0,
	`averageOffspringSurvivalRate` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breedingAnalyticsSummary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breedingPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`totalBreedingEvents` int DEFAULT 0,
	`successfulBreedings` int DEFAULT 0,
	`failedBreedings` int DEFAULT 0,
	`successRate` decimal(5,2),
	`totalOffspring` int DEFAULT 0,
	`maleOffspring` int DEFAULT 0,
	`femaleOffspring` int DEFAULT 0,
	`offspringSurvivalRate` decimal(5,2),
	`averageOffspringWeight` decimal(8,2),
	`lastBreedingDate` date,
	`nextRecommendedBreedingDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breedingPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breedingRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`sireId` int NOT NULL,
	`damId` int NOT NULL,
	`recommendationScore` decimal(5,2),
	`geneticCompatibility` decimal(5,2),
	`traitImprovement` text,
	`riskFactors` text,
	`inbreedingRisk` decimal(5,2),
	`recommendedBreedingAge` int,
	`estimatedOffspringQuality` varchar(50),
	`status` enum('pending','recommended','not_recommended','executed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breedingRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `geneticHealthScreening` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`screeningDate` date NOT NULL,
	`screeningType` varchar(100) NOT NULL,
	`diseaseRisks` text,
	`carrierStatus` text,
	`healthScore` decimal(5,2),
	`recommendations` text,
	`veterinarianNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geneticHealthScreening_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `geneticTraits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`traitName` varchar(255) NOT NULL,
	`traitValue` decimal(8,2) NOT NULL,
	`traitUnit` varchar(50),
	`inheritancePattern` enum('dominant','recessive','codominant','polygenic') DEFAULT 'polygenic',
	`recordedDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geneticTraits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offspringRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`breedingRecordId` int NOT NULL,
	`offspringAnimalId` int NOT NULL,
	`birthDate` date NOT NULL,
	`birthWeight` decimal(8,2),
	`gender` enum('male','female','unknown') DEFAULT 'unknown',
	`healthStatus` enum('healthy','weak','diseased','deceased') DEFAULT 'healthy',
	`survivalStatus` enum('alive','deceased') DEFAULT 'alive',
	`deathDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offspringRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedigreeRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`animalId` int NOT NULL,
	`generation` int NOT NULL,
	`patternalLineage` text,
	`maternalLineage` text,
	`inbreedingCoefficient` decimal(5,4),
	`purebredStatus` enum('purebred','crossbred','hybrid') DEFAULT 'crossbred',
	`registrationNumber` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedigreeRecords_id` PRIMARY KEY(`id`)
);
