CREATE TABLE `articles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content` text,
	`source` varchar(100) NOT NULL,
	`url` varchar(500) NOT NULL,
	`image_url` varchar(500),
	`category` varchar(50) NOT NULL DEFAULT 'عام',
	`published_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_url_unique` UNIQUE(`url`)
);
