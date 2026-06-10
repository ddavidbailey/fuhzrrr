CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`endpoint` text NOT NULL,
	`mutation_type` text NOT NULL,
	`status_code` integer NOT NULL,
	`latency_ms` integer NOT NULL,
	`response_body` text NOT NULL,
	`original_request` text NOT NULL,
	`variant_request` text NOT NULL,
	`severity` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`composite` real NOT NULL,
	`input_validation` real NOT NULL,
	`auth_hardening` real NOT NULL,
	`error_hygiene` real NOT NULL,
	`resilience` real NOT NULL,
	`rate_limiting` real NOT NULL,
	`route_scores` text NOT NULL
);
