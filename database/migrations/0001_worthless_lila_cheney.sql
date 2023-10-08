ALTER TABLE "user" ALTER COLUMN "condominium_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "employee_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "condominium" ADD CONSTRAINT "condominium_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "condominium" ADD CONSTRAINT "condominium_cnpj_unique" UNIQUE("cnpj");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "user_key" ADD CONSTRAINT "user_key_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_id_unique" UNIQUE("id");