-- ============================================================================
-- Nexus — pending migrations to run manually on the live Supabase DB (cnfrf…)
-- Paste this whole file into the Supabase SQL Editor and run once. It is
-- idempotent, so re-running is safe.
--
-- Covers three changes authored in this session:
--   1. 20260626150000  Fix the "ON CONFLICT" error when creating a competition
--   2. 20260626130000  Let HIC / coach / regional admins generate (RLS)
--   3. 20260626140000  Roster-sync schema (only matters once SS PR #6 deploys)
-- ============================================================================


-- 1) FIX: "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification" when creating a Handball/Netball competition. -------------
DELETE FROM public.calendar_events a
USING public.calendar_events b
WHERE a.competition_id IS NOT NULL
  AND a.competition_id = b.competition_id
  AND a.ctid < b.ctid;

DROP INDEX IF EXISTS public.calendar_events_competition_unique;

CREATE UNIQUE INDEX calendar_events_competition_unique
  ON public.calendar_events (competition_id);


-- 2) RLS: competitions & fixtures generation for the real organiser roles. ----
CREATE OR REPLACE FUNCTION public.is_competition_organizer(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_uid, 'super_admin')
    OR public.has_role(_uid, 'admin')
    OR public.has_role(_uid, 'federation_official')
    OR public.has_role(_uid, 'national_admin')
    OR public.has_role(_uid, 'provincial_admin')
    OR public.has_role(_uid, 'district_admin')
    OR public.has_role(_uid, 'zonal_admin')
    OR public.has_role(_uid, 'hic')
    OR public.has_role(_uid, 'coach');
$$;

GRANT EXECUTE ON FUNCTION public.is_competition_organizer(uuid) TO authenticated;

DROP POLICY IF EXISTS "Officials create competitions" ON public.competitions;
CREATE POLICY "Officials create competitions"
  ON public.competitions FOR INSERT TO authenticated
  WITH CHECK (public.is_competition_organizer(auth.uid()));

DROP POLICY IF EXISTS "Officials update competitions" ON public.competitions;
CREATE POLICY "Officials update competitions"
  ON public.competitions FOR UPDATE TO authenticated
  USING (public.is_competition_organizer(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_competition_organizer(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Officials manage fixtures" ON public.fixtures;
CREATE POLICY "Officials manage fixtures"
  ON public.fixtures FOR ALL TO authenticated
  USING (
    public.is_competition_organizer(auth.uid())
    OR auth.uid() = referee_id
    OR auth.uid() = scorer_id
  )
  WITH CHECK (
    public.is_competition_organizer(auth.uid())
    OR auth.uid() = referee_id
    OR auth.uid() = scorer_id
  );


-- 3) Roster sync schema (Scholastic squads -> school_teams / players). --------
ALTER TABLE public.school_teams
  ADD COLUMN IF NOT EXISTS external_ss_team_id text;

CREATE UNIQUE INDEX IF NOT EXISTS school_teams_external_ss_team_id_key
  ON public.school_teams (external_ss_team_id);

CREATE UNIQUE INDEX IF NOT EXISTS school_team_players_team_athlete_key
  ON public.school_team_players (school_team_id, athlete_id);
