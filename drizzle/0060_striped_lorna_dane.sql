ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) DEFAULT null;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `googleId` varchar(255) DEFAULT null;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) NOT NULL;