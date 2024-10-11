DROP INDEX IF EXISTS "client_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "deleted_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "agent_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "inserted_at_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clientId_idx" ON "account" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletedAt_idx" ON "archive" USING btree ("deleted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentId_idx" ON "client" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_insertedAt_idx" ON "transactions" USING btree ("account_id","inserted_at" DESC NULLS LAST);