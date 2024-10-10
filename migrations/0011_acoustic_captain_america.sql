CREATE TABLE IF NOT EXISTS "archive" (
	"id" serial PRIMARY KEY NOT NULL,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	"table_name" text NOT NULL,
	"data" jsonb NOT NULL
);