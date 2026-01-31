CREATE TABLE `weatherHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`temperature` decimal(5,2),
	`feelsLike` decimal(5,2),
	`humidity` int,
	`pressure` int,
	`windSpeed` decimal(5,2),
	`windDirection` int,
	`cloudCover` int,
	`precipitation` decimal(5,2),
	`weatherCondition` varchar(100),
	`weatherDescription` text,
	`sunrise` timestamp,
	`sunset` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weatherHistory_id` PRIMARY KEY(`id`)
);
