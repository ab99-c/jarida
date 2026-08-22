CREATE TABLE `comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`author_name` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
