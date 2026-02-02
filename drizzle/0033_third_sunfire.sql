ALTER TABLE `searchIndexes` MODIFY COLUMN `searchScore` decimal(5,2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE `userFavorites` MODIFY COLUMN `position` int NOT NULL;