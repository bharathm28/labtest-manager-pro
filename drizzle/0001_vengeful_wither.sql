CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`action` text NOT NULL,
	`field_name` text,
	`old_value` text,
	`new_value` text,
	`reason` text,
	`performed_by` text,
	`timestamp` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`serial_number` text,
	`description` text,
	`status` text DEFAULT 'available' NOT NULL,
	`current_location` text,
	`assigned_to_employee_id` integer,
	`assigned_date` text,
	`assigned_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assigned_to_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_serial_number_unique` ON `inventory` (`serial_number`);--> statement-breakpoint
CREATE TABLE `inventory_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_id` integer NOT NULL,
	`action` text NOT NULL,
	`employee_id` integer,
	`from_location` text,
	`to_location` text,
	`reason` text,
	`performed_by` text,
	`timestamp` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `remarks` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `employee_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_code_unique` ON `employees` (`employee_code`);