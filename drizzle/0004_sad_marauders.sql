CREATE TABLE `task_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`notification_type` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`sent` integer DEFAULT false NOT NULL,
	`sent_at` text,
	`employee_id` integer NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `testbed_tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `model`;--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `next_calibration`;