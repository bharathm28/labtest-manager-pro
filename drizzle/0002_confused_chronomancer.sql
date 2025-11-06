CREATE TABLE `testbed_task_transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`from_testbed_id` integer NOT NULL,
	`to_testbed_id` integer NOT NULL,
	`reason` text NOT NULL,
	`transferred_by` text,
	`transferred_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`task_id`) REFERENCES `testbed_tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_testbed_id`) REFERENCES `test_beds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_testbed_id`) REFERENCES `test_beds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `testbed_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_request_id` integer NOT NULL,
	`testbed_id` integer NOT NULL,
	`assigned_employee_id` integer,
	`status` text DEFAULT 'queued' NOT NULL,
	`priority` text DEFAULT 'normal',
	`scheduled_start_date` text,
	`scheduled_end_date` text,
	`actual_start_date` text,
	`actual_end_date` text,
	`queue_position` integer DEFAULT 0,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`service_request_id`) REFERENCES `service_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`testbed_id`) REFERENCES `test_beds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
