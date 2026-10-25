CREATE TABLE `chats` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'New chat',
	`learning_method_id` int NOT NULL,
	`streaming_started_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connected_apps` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`google_account_id` varchar(255) NOT NULL,
	`account_email` varchar(255) NOT NULL,
	`account_type` enum('personal','edu') NOT NULL DEFAULT 'personal',
	`apps` json NOT NULL,
	`scopes` json NOT NULL,
	`access_token_encrypted` text,
	`refresh_token_encrypted` text,
	`token_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `connected_user_google_uq` UNIQUE(`user_id`,`google_account_id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`chat_id` varchar(36) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` longtext NOT NULL,
	`status` enum('complete','streaming','stopped','error') NOT NULL DEFAULT 'complete',
	`model` varchar(100),
	`created_at` timestamp(3) NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`user_agent` varchar(512),
	`ip_address` varchar(64),
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_token_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`google_id` varchar(255),
	`auth_provider` enum('local','google') NOT NULL DEFAULT 'local',
	`gemini_api_key_encrypted` text,
	`learning_method_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`),
	CONSTRAINT `users_google_id_uq` UNIQUE(`google_id`)
);
--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `chats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connected_apps` ADD CONSTRAINT `connected_apps_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_id_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chats_user_updated_idx` ON `chats` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `connected_user_idx` ON `connected_apps` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_chat_created_idx` ON `messages` (`chat_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `refresh_user_idx` ON `refresh_tokens` (`user_id`);