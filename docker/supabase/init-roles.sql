-- =============================================================================
-- Supabase stack — PostgreSQL roles initialisation (idempotent)
-- Applied by the supabase-db-init service at every docker-compose start.
-- All statements are safe to run multiple times.
-- =============================================================================

-- 1. Create roles (skip if they already exist)
DO $$
BEGIN
  -- postgres: GoTrue migrations hardcode "GRANT ... TO postgres".
  -- Notre instance n'a pas ce rôle (superuser = krealabs), on le crée en alias.
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres NOLOGIN;
    RAISE NOTICE 'Created role: postgres (alias for GoTrue compat)';
  END IF;
  -- anon: used for anonymous PostgREST requests
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
    RAISE NOTICE 'Created role: anon';
  END IF;

  -- authenticated: used for logged-in PostgREST requests
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
    RAISE NOTICE 'Created role: authenticated';
  END IF;

  -- service_role: superuser-level, bypasses RLS
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    RAISE NOTICE 'Created role: service_role';
  END IF;

  -- authenticator: PostgREST connects with this login role
  --   then switches to anon / authenticated based on JWT
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'supabase-authenticator-dev';
    RAISE NOTICE 'Created role: authenticator';
  END IF;

  -- supabase_auth_admin: GoTrue connects with this role to manage auth schema
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'supabase-auth-admin-dev';
    RAISE NOTICE 'Created role: supabase_auth_admin';
  END IF;

END
$$;

-- 5. supabase_admin — postgres-meta v0.84+ uses this role for Studio requests.
--    Password MUST match POSTGRES_PASSWORD (injected via psql -v at startup).
--    :'supabase_admin_password' substitution requires being OUTSIDE a DO $$ block.
\set ON_ERROR_STOP off
CREATE ROLE supabase_admin LOGIN SUPERUSER PASSWORD :'supabase_admin_password';
\set ON_ERROR_STOP on
-- Always sync the password so it stays in sync with POSTGRES_PASSWORD (idempotent)
ALTER ROLE supabase_admin PASSWORD :'supabase_admin_password';

-- 5. pg_stat_statements extension (needed for Studio Query Performance tab)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. Grant sub-roles to authenticator (PostgREST role switching)
GRANT anon        TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role  TO authenticator;

-- 3. Public schema — grant access to all Supabase roles
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL ROUTINES  IN SCHEMA public TO anon, authenticated, service_role;

-- Future objects created in public will also be accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES  TO anon, authenticated, service_role;

-- 4. Auth schema — created and owned by supabase_auth_admin (for GoTrue)
CREATE SCHEMA IF NOT EXISTS auth;
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL     ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE   ON SCHEMA auth TO krealabs, authenticated, anon;

-- Allow GoTrue admin to manage extensions
GRANT ALL ON SCHEMA extensions TO supabase_auth_admin;

-- Ensure extensions schema exists (GoTrue uses it)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
