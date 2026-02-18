CREATE TABLE `authProviderStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`manusLogins` int NOT NULL DEFAULT 0,
	`googleLogins` int NOT NULL DEFAULT 0,
	`totalLogins` int NOT NULL DEFAULT 0,
	`manusSuccessRate` decimal(5,2) DEFAULT 100,
	`googleSuccessRate` decimal(5,2) DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authProviderStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `authProviderStats_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `backupCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backupCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `backupCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `loginAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`authProvider` enum('manus','google') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`deviceType` enum('mobile','tablet','desktop') NOT NULL DEFAULT 'desktop',
	`loginTime` timestamp NOT NULL DEFAULT (now()),
	`country` varchar(100),
	`city` varchar(100),
	`successfulLogin` boolean NOT NULL DEFAULT true,
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loginAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptType` enum('totp','sms') NOT NULL,
	`successful` boolean NOT NULL DEFAULT false,
	`attemptTime` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoFactorAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`primaryMethod` enum('totp','sms','none') NOT NULL DEFAULT 'none',
	`backupMethod` enum('totp','sms','none') NOT NULL DEFAULT 'none',
	`enabledAt` timestamp,
	`disabledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactorSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorSettings_userId_unique` UNIQUE(`userId`)
);
