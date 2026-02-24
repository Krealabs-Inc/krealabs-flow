-- Migration 0004 : Support multi-organisation
-- Tables : user_organizations + nouvelles colonnes sur organizations, invoices, quotes

-- ──────────────────────────────────────────────────────────────────────────────
-- Nouvelles colonnes sur organizations
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "legal_form" varchar(50) DEFAULT 'autre';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "tva_regime" varchar(50) DEFAULT 'reel_simplifie';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "capital_social" numeric(15,2);

-- ──────────────────────────────────────────────────────────────────────────────
-- Table user_organizations : lien Stack Auth user ↔ org
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_organizations" (
  "stack_user_id" varchar(255)  NOT NULL,
  "org_id"        uuid          NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "role"          varchar(20)   DEFAULT 'owner',
  "is_primary"    boolean       DEFAULT false,
  "joined_at"     timestamptz   DEFAULT now(),
  PRIMARY KEY ("stack_user_id", "org_id")
);

-- ──────────────────────────────────────────────────────────────────────────────
-- issuingOrgId sur invoices + quotes (nullable : fallback sur organizationId)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "issuing_org_id" uuid REFERENCES "organizations"("id");
ALTER TABLE "quotes"   ADD COLUMN IF NOT EXISTS "issuing_org_id" uuid REFERENCES "organizations"("id");

-- ──────────────────────────────────────────────────────────────────────────────
-- Seed : lier le user dev (dev-user-001) à l'org par défaut
-- En production, remplacer 'dev-user-001' par le vrai stack_user_id
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO "user_organizations" ("stack_user_id", "org_id", "role", "is_primary")
VALUES ('dev-user-001', 'ab33997e-aa9b-4fcd-ab56-657971f81e8a', 'owner', true)
ON CONFLICT DO NOTHING;
