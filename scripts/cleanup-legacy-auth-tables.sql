-- Drop orphaned singular Better Auth tables.
--
-- The app schema (packages/storage/src/db/schema/auth.schema.ts) uses the
-- plural tables: users, sessions, accounts, verifications, organizations,
-- members, invitations. An older Better Auth setup left singular duplicates
-- (user, session, account, verification, organization, member) in the
-- database. They are unused by the app and their foreign keys point at the
-- wrong tables, which breaks org membership inserts for new signups.
--
-- Safe to run more than once. Run against each environment once:
--   psql "$DATABASE_URL" -f scripts/cleanup-legacy-auth-tables.sql

BEGIN;

-- Only drop the singular tables when the plural equivalents exist.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.verification CASCADE;
    DROP TABLE IF EXISTS public.account CASCADE;
    DROP TABLE IF EXISTS public.session CASCADE;
    DROP TABLE IF EXISTS public.member CASCADE;
    DROP TABLE IF EXISTS public.organization CASCADE;
    DROP TABLE IF EXISTS public."user" CASCADE;
  ELSE
    RAISE NOTICE 'Plural auth tables not found; skipping legacy cleanup.';
  END IF;
END $$;

COMMIT;
