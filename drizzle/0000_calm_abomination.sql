CREATE TABLE `bookings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`patient_name` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`address` text NOT NULL,
	`service_name` varchar(255) NOT NULL,
	`notes` text,
	`booking_date` varchar(50),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
