ALTER TABLE "account" ALTER COLUMN "account_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "client" ALTER COLUMN "client_id" SET DEFAULT gen_random_uuid();