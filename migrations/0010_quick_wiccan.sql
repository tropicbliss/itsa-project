ALTER TABLE "client" ADD COLUMN "agent_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN IF EXISTS "is_verified";