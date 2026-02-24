CREATE TYPE "public"."client_pipeline_stage" AS ENUM('prospect', 'contact_made', 'proposal_sent', 'negotiation', 'active', 'inactive', 'lost');--> statement-breakpoint
CREATE TABLE "tva_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"quarter" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"ca_ht" numeric(12, 2) DEFAULT '0',
	"tva_collected" numeric(12, 2) DEFAULT '0',
	"tva_deductible" numeric(12, 2) DEFAULT '0',
	"tva_to_pay" numeric(12, 2) DEFAULT '0',
	"declared_at" timestamp with time zone,
	"payment_due_date" date,
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tva_decl_org_year_quarter" UNIQUE("organization_id","year","quarter")
);
--> statement-breakpoint
CREATE TABLE "fiscal_config" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"creation_date" date NOT NULL,
	"first_closing_date" date NOT NULL,
	"closing_month" integer DEFAULT 12 NOT NULL,
	"closing_day" integer DEFAULT 31 NOT NULL,
	"tva_regime" varchar(50) DEFAULT 'reel_simplifie' NOT NULL,
	"urssaf_enabled" boolean DEFAULT false,
	"tva_by_fiscal_year" jsonb DEFAULT '{}'::jsonb,
	"cfe_estimated_amount" numeric(12, 2),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fiscal_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"obligation_key" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"amount_override" numeric(12, 2),
	"notes" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "pipeline_stage" "client_pipeline_stage" DEFAULT 'prospect';--> statement-breakpoint
ALTER TABLE "tva_declarations" ADD CONSTRAINT "tva_declarations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_config" ADD CONSTRAINT "fiscal_config_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_obligations" ADD CONSTRAINT "fiscal_obligations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiscal_oblig_org_key_idx" ON "fiscal_obligations" USING btree ("organization_id","obligation_key");