-- Add 2FA (TOTP) support
ALTER TABLE `users` ADD COLUMN `totpSecret` varchar(255) AFTER `googleId`;
ALTER TABLE `users` ADD COLUMN `totpEnabled` boolean DEFAULT false AFTER `totpSecret`;
ALTER TABLE `users` ADD COLUMN `phoneNumber` varchar(20) AFTER `totpEnabled`;
ALTER TABLE `users` ADD COLUMN `smsEnabled` boolean DEFAULT false AFTER `phoneNumber`;

-- Create backup codes table for account recovery
CREATE TABLE IF NOT EXISTS `backupCodes` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `code` varchar(20) NOT NULL UNIQUE,
  `used` boolean DEFAULT false,
  `usedAt` datetime,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`userId`)
);

-- Create login analytics table
CREATE TABLE IF NOT EXISTS `loginAnalytics` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `authProvider` enum('manus', 'google') NOT NULL,
  `ipAddress` varchar(45),
  `userAgent` varchar(500),
  `deviceType` enum('mobile', 'tablet', 'desktop') DEFAULT 'desktop',
  `loginTime` datetime DEFAULT CURRENT_TIMESTAMP,
  `country` varchar(100),
  `city` varchar(100),
  `successfulLogin` boolean DEFAULT true,
  `failureReason` varchar(255),
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_login_time` (`loginTime`),
  INDEX `idx_auth_provider` (`authProvider`)
);

-- Create 2FA attempts table for rate limiting
CREATE TABLE IF NOT EXISTS `twoFactorAttempts` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `attemptType` enum('totp', 'sms') NOT NULL,
  `successful` boolean DEFAULT false,
  `attemptTime` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_attempt_time` (`attemptTime`)
);

-- Create 2FA settings table
CREATE TABLE IF NOT EXISTS `twoFactorSettings` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL UNIQUE,
  `primaryMethod` enum('totp', 'sms', 'none') DEFAULT 'none',
  `backupMethod` enum('totp', 'sms', 'none') DEFAULT 'none',
  `enabledAt` datetime,
  `disabledAt` datetime,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`userId`)
);
