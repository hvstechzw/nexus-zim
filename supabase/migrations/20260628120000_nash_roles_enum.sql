-- ════════════════════════════════════════════════════════════════
-- NASH OVERHAUL — Step 1a: role hierarchy (app_role enum additions)
-- ════════════════════════════════════════════════════════════════
-- Adds the new NASH/NAPH 20-role hierarchy to the existing app_role enum.
-- Additive only (ADD VALUE IF NOT EXISTS) — existing roles are preserved.
-- Kept in its own migration so the new values are committed before any
-- later migration / policy references them (Postgres forbids using a freshly
-- added enum value inside the same transaction that adds it).

-- Platform tier
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';

-- Federation tier (NASH / NAPH national)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nash_national';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'naph_national';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'national_technical_director';

-- Provincial tier
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'provincial_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'provincial_technical_director';

-- District tier
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'district_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'district_technical_director';

-- Zonal tier
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'zonal_admin';

-- School tier (coach + team_manager already exist)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_head';

-- Officials tier (referee + scorer already exist)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'timekeeper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_delegate';

-- Athlete / spectator tier (athlete already exists)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'public';

-- Operations tier (broadcaster already exists)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'competition_organiser';
