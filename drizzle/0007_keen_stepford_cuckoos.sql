CREATE TABLE `marketplaceProductImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplaceProductImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `marketplaceProductImages` ADD CONSTRAINT `marketplaceProductImages_productId_marketplaceProducts_id_fk` FOREIGN KEY (`productId`) REFERENCES `marketplaceProducts`(`id`) ON DELETE cascade ON UPDATE no action;