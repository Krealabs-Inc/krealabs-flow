-- Migration 0003 : Module obligations fiscales
-- Tables : fiscal_config + fiscal_obligations

-- ──────────────────────────────────────────────────────────────────────────────
-- fiscal_config : configuration fiscale par organisation (1 ligne / org)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "fiscal_config" (
  "organization_id"     uuid         PRIMARY KEY REFERENCES "organizations"("id"),
  "creation_date"       date         NOT NULL,
  "first_closing_date"  date         NOT NULL,
  "closing_month"       integer      NOT NULL DEFAULT 12,
  "closing_day"         integer      NOT NULL DEFAULT 31,
  "tva_regime"          varchar(50)  NOT NULL DEFAULT 'reel_simplifie',
  "urssaf_enabled"      boolean               DEFAULT false,
  "tva_by_fiscal_year"  jsonb                 DEFAULT '{}',
  "cfe_estimated_amount" numeric(12,2),
  "updated_at"          timestamptz           DEFAULT now()
);

COMMENT ON TABLE "fiscal_config" IS
  'Configuration fiscale par organisation : régime TVA, dates de clôture, TVA historique.';

COMMENT ON COLUMN "fiscal_config"."tva_by_fiscal_year" IS
  'TVA nette annuelle par exercice. Ex : {"2026": 12000, "2027": 15000}. Utilisé pour calcul acomptes.';

-- ──────────────────────────────────────────────────────────────────────────────
-- fiscal_obligations : overrides de statut et montant pour les obligations générées
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "fiscal_obligations" (
  "id"               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  uuid         NOT NULL REFERENCES "organizations"("id"),
  "obligation_key"   varchar(100) NOT NULL,
  "status"           varchar(20)  NOT NULL DEFAULT 'pending',
  "amount_override"  numeric(12,2),
  "notes"            text,
  "paid_at"          timestamptz,
  "created_at"       timestamptz  DEFAULT now(),
  "updated_at"       timestamptz  DEFAULT now(),
  CONSTRAINT "fiscal_oblig_org_key_idx" UNIQUE ("organization_id", "obligation_key")
);

COMMENT ON TABLE "fiscal_obligations" IS
  'Surcharges de statut et montant pour les obligations fiscales générées algorithmiquement.';

COMMENT ON COLUMN "fiscal_obligations"."obligation_key" IS
  'Clé déterministe. Ex : TVA_CA12_2027, TVA_ACOMPTE_JUILLET_2027, CFE_2027, LIASSE_2027.';
