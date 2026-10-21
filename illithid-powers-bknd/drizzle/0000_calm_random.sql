CREATE TABLE `abilities` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`vial_cost` integer NOT NULL,
	`requires` text DEFAULT '[]' NOT NULL,
	CONSTRAINT "abilities_cost_non_negative" CHECK("abilities"."vial_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE `user_abilities` (
	`user_id` integer NOT NULL,
	`ability_key` text NOT NULL,
	`claimed_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `ability_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ability_key`) REFERENCES `abilities`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`vials` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_vials_non_negative" CHECK("users"."vials" >= 0),
	CONSTRAINT "users_role_valid" CHECK("users"."role" in ('player', 'dm'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);