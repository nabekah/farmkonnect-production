CREATE TABLE `cropHealthRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`recordDate` date NOT NULL,
	`issueType` enum('disease','pest','nutrient_deficiency','weather_damage','other') NOT NULL,
	`issueName` varchar(255) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`affectedArea` varchar(255),
	`symptoms` text,
	`photoUrls` text,
	`notes` text,
	`status` enum('active','treated','resolved') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cropHealthRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cropTreatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthRecordId` int NOT NULL,
	`treatmentDate` date NOT NULL,
	`treatmentType` varchar(255) NOT NULL,
	`productName` varchar(255),
	`dosage` varchar(255),
	`applicationMethod` varchar(255),
	`cost` decimal(10,2),
	`appliedByUserId` int,
	`effectiveness` enum('not_evaluated','ineffective','partially_effective','effective','very_effective') DEFAULT 'not_evaluated',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cropTreatments_id` PRIMARY KEY(`id`)
);
