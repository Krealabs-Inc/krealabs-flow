ALTER TABLE "quotes" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."quote_status";--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'partially_invoiced', 'fully_invoiced');--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."quote_status";--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "status" SET DATA TYPE "public"."quote_status" USING "status"::"public"."quote_status";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "siren" varchar(9);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "account_holder" varchar(255);