ALTER TABLE "user" DROP CONSTRAINT "user_condominium_id_condominium_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_employee_id_employee_id_fk";
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "condominium_id" uuid;--> statement-breakpoint
ALTER TABLE "condominium" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "employee" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company" ADD CONSTRAINT "company_condominium_id_condominium_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "condominium"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "condominium" ADD CONSTRAINT "condominium_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_company_id_fk" FOREIGN KEY ("user_id") REFERENCES "company"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "condominium_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "employee_id";