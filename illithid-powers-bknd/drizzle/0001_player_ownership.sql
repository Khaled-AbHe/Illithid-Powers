ALTER TABLE `users` ADD `dm_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `users_dm_id_idx` ON `users` (`dm_id`);--> statement-breakpoint
-- Existing players belong to the existing DM, so nothing is orphaned and that DM keeps working.
-- Only fills players with no owner yet, so it is safe to run on a database that already has some.
UPDATE `users` SET `dm_id` = (SELECT `id` FROM `users` WHERE `role` = 'dm' ORDER BY `id` LIMIT 1) WHERE `role` = 'player' AND `dm_id` IS NULL;
