CREATE TABLE IF NOT EXISTS "seller_onboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL UNIQUE,
	"current_step" integer DEFAULT 1 NOT NULL,
	"vip_status" varchar(20) DEFAULT 'pending',
	"questionnaire" text,
	"agreements" text,
	"store_data" text,
	"decoration_data" text,
	"products_data" text,
	"managed_service" boolean,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
 ALTER TABLE "seller_onboarding" ADD CONSTRAINT "seller_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
