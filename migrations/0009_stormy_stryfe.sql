ALTER TABLE "client" ALTER COLUMN "is_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "client" ALTER COLUMN "is_verified" DROP NOT NULL;