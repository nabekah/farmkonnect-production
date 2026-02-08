CREATE TABLE `searchAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` varchar(255) NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`resultClicked` boolean NOT NULL DEFAULT false,
	`clickedResultId` int,
	`clickedResultType` varchar(50),
	`searchDuration` int,
	`filters` json,
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`suggestionText` varchar(255) NOT NULL,
	`suggestionType` varchar(50) NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trendingSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(255) NOT NULL,
	`searchCount` int NOT NULL DEFAULT 1,
	`clickThroughRate` decimal(5,2) DEFAULT '0',
	`averageResultCount` decimal(8,2) DEFAULT '0',
	`period` varchar(20) NOT NULL,
	`rank` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trendingSearches_id` PRIMARY KEY(`id`)
);
