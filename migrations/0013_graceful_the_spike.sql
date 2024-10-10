CREATE INDEX IF NOT EXISTS "client_id_idx" ON "account" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deleted_at_idx" ON "archive" USING btree ("deleted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_id_idx" ON "client" USING btree ("agent_id");