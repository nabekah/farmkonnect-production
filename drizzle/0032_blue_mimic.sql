CREATE TABLE `navigationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`breadcrumbTrail` text NOT NULL,
	`visitedAt` timestamp NOT NULL DEFAULT (now()),
	`sessionId` varchar(100),
	`referrerPath` varchar(255),
	CONSTRAINT `navigationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchIndexes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`keywords` text,
	`category` varchar(100) NOT NULL,
	`icon` varchar(100),
	`searchScore` decimal(5,2) DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searchIndexes_id` PRIMARY KEY(`id`),
	CONSTRAINT `searchIndexes_path_unique` UNIQUE(`path`)
);
--> statement-breakpoint
CREATE TABLE `userFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`menuPath` varchar(255) NOT NULL,
	`menuLabel` varchar(255) NOT NULL,
	`menuIcon` varchar(100),
	`position` int NOT NULL DEFAULT 0,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userFavorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `navigationHistory` ADD CONSTRAINT `navigationHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userFavorites` ADD CONSTRAINT `userFavorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;