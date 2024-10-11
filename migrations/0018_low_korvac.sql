ALTER TABLE "transactions" RENAME COLUMN "transaction" TO "transaction_type";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "amount" TO "transaction_amount";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "date" TO "transaction_date";--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "status" TO "transaction_status";