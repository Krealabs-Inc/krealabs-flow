-- Migration 0006 : Dissocier les colonnes created_by / user_id de la table users
-- L'authentification est gérée par Stack Auth (stack_user_id en varchar),
-- la table users interne n'est pas alimentée et provoque des violations de FK.
-- On convertit toutes les colonnes concernées en varchar(255) sans FK.

-- ── audit_logs.user_id ──────────────────────────────────────────────────────
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_users_id_fk";
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" TYPE varchar(255) USING "user_id"::text;

-- ── quotes.created_by ───────────────────────────────────────────────────────
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_created_by_users_id_fk";
ALTER TABLE "quotes" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── invoices.created_by ─────────────────────────────────────────────────────
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_created_by_users_id_fk";
ALTER TABLE "invoices" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── payments.created_by ─────────────────────────────────────────────────────
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_created_by_users_id_fk";
ALTER TABLE "payments" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── contracts.created_by ────────────────────────────────────────────────────
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_created_by_users_id_fk";
ALTER TABLE "contracts" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── projects.created_by ─────────────────────────────────────────────────────
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_created_by_users_id_fk";
ALTER TABLE "projects" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── templates.created_by ────────────────────────────────────────────────────
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_created_by_users_id_fk";
ALTER TABLE "templates" ALTER COLUMN "created_by" TYPE varchar(255) USING "created_by"::text;

-- ── notifications.user_id ───────────────────────────────────────────────────
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk";
ALTER TABLE "notifications" ALTER COLUMN "user_id" TYPE varchar(255) USING "user_id"::text;

