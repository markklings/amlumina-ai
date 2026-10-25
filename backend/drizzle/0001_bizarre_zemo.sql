CREATE TABLE `ai_usage` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`day` varchar(10) NOT NULL,
	`input_tokens` int NOT NULL DEFAULT 0,
	`output_tokens` int NOT NULL DEFAULT 0,
	CONSTRAINT `ai_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_usage_user_day_uq` UNIQUE(`user_id`,`day`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `tool_calls` json;--> statement-breakpoint
ALTER TABLE `ai_usage` ADD CONSTRAINT `ai_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;