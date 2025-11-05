CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_persons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name` text NOT NULL,
	`designation` text,
	`phone` text,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`designation` text,
	`email` text NOT NULL,
	`phone` text,
	`department` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_card_number` text NOT NULL,
	`company_id` integer NOT NULL,
	`contact_person_id` integer,
	`product_name` text NOT NULL,
	`product_description` text,
	`quantity` integer,
	`test_type` text,
	`special_requirements` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`requested_date` text,
	`agreed_date` text,
	`material_received_date` text,
	`testing_start_date` text,
	`testing_end_date` text,
	`completion_date` text,
	`assigned_employee_id` integer,
	`assigned_testbed_id` integer,
	`dc_number` text,
	`dc_verified` integer DEFAULT false,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_person_id`) REFERENCES `contact_persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_testbed_id`) REFERENCES `test_beds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_requests_job_card_number_unique` ON `service_requests` (`job_card_number`);--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_request_id` integer NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`changed_by` text,
	`changed_at` text NOT NULL,
	FOREIGN KEY (`service_request_id`) REFERENCES `service_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test_beds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`location` text,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` text NOT NULL
);
