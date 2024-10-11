CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"transaction" char(1),
	"amount" numeric(19, 4) NOT NULL,
	"inserted_at" timestamp DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inserted_at_idx" ON "transactions" USING btree ("inserted_at" DESC NULLS LAST);