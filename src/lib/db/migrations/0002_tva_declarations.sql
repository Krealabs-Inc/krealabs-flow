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
ALTER TABLE "tva_declarations" ADD CONSTRAINT "tva_declarations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
