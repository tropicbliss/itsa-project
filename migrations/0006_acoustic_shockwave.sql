ALTER TABLE "account" ALTER COLUMN "initial_deposit" SET DATA TYPE numeric(19, 4);--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "currency" SET DATA TYPE char(3);