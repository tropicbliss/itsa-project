CREATE TABLE IF NOT EXISTS "account" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"account_type" varchar(8) NOT NULL,
	"account_status" varchar(8) NOT NULL,
	"opening_date" date NOT NULL,
	"initial_deposit" numeric(15, 2),
	"currency" text NOT NULL,
	"branchId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client" (
	"client_id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" varchar(14) NOT NULL,
	"email_address" text NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"address" varchar(100) NOT NULL,
	"city" varchar(50) NOT NULL,
	"state" varchar(50) NOT NULL,
	"country" varchar(50) NOT NULL,
	"postal_code" varchar(10) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_client_id_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("client_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
