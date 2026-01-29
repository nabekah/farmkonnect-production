CREATE TABLE `themeConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`secondaryColor` varchar(7) NOT NULL DEFAULT '#10b981',
	`accentColor` varchar(7) NOT NULL DEFAULT '#f59e0b',
	`backgroundColor` varchar(7) NOT NULL DEFAULT '#ffffff',
	`textColor` varchar(7) NOT NULL DEFAULT '#1f2937',
	`borderColor` varchar(7) NOT NULL DEFAULT '#e5e7eb',
	`fontFamily` varchar(255) NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
	`fontSize` varchar(10) NOT NULL DEFAULT '16px',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themeConfigs_id` PRIMARY KEY(`id`)
);
