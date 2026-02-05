CREATE TABLE `fieldWorkerActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logId` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`taskId` varchar(50),
	`activityType` enum('crop_health','pest_monitoring','disease_detection','irrigation','fertilizer_application','weed_control','harvest','equipment_check','soil_test','weather_observation','general_note') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`observations` text,
	`gpsLatitude` decimal(10,8),
	`gpsLongitude` decimal(11,8),
	`photoUrls` text,
	`duration` int,
	`status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`syncedToServer` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerActivityLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldWorkerActivityLogs_logId_unique` UNIQUE(`logId`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerDashboardPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`widgetOrder` text,
	`visibleWidgets` text,
	`refreshInterval` int DEFAULT 300000,
	`theme` varchar(50) DEFAULT 'light',
	`compactMode` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerDashboardPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldWorkerDashboardPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerEquipmentAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`equipmentId` int NOT NULL,
	`assignedDate` timestamp NOT NULL DEFAULT (now()),
	`returnedDate` timestamp,
	`condition` enum('good','fair','poor','damaged') NOT NULL DEFAULT 'good',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerEquipmentAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerOfflineQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueId` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`actionType` enum('create_activity','update_activity','create_task','update_task','clock_in','clock_out') NOT NULL,
	`payload` text NOT NULL,
	`status` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`syncAttempts` int NOT NULL DEFAULT 0,
	`lastSyncAttempt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerOfflineQueue_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldWorkerOfflineQueue_queueId_unique` UNIQUE(`queueId`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`managerId` int NOT NULL,
	`specialization` varchar(255),
	`experience` varchar(50),
	`phoneNumber` varchar(20),
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldWorkerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(50) NOT NULL,
	`assignedToUserId` int NOT NULL,
	`assignedByUserId` int NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskType` enum('planting','monitoring','irrigation','fertilization','pest_control','weed_control','harvest','equipment_maintenance','soil_testing','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` timestamp NOT NULL,
	`startDate` timestamp,
	`completedDate` timestamp,
	`estimatedDuration` int,
	`actualDuration` int,
	`notes` text,
	`completionNotes` text,
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldWorkerTasks_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `fieldWorkerTimeTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int NOT NULL,
	`clockInTime` timestamp NOT NULL,
	`clockOutTime` timestamp,
	`workDuration` int,
	`taskId` varchar(50),
	`breakDuration` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldWorkerTimeTracking_id` PRIMARY KEY(`id`)
);
