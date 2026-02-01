CREATE TABLE `marketplaceOrderDisputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`evidence` text,
	`status` enum('pending','under_review','resolved','rejected') NOT NULL DEFAULT 'pending',
	`resolution` text,
	`adminNotes` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceOrderDisputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceOrderReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`sellerResponse` text,
	`sellerResponseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceOrderReviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplaceOrderReviews_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceSellerPayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`payoutDate` date,
	`transactionReference` varchar(255),
	`paymentMethod` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceSellerPayouts_id` PRIMARY KEY(`id`)
);
