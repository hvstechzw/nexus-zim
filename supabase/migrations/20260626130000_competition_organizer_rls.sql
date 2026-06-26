-- Fix: competitions & fixtures "not generating" for HIC / coach / regional admins.
--
-- The app_role enum was later extended with the real organiser roles (hic,
-- coach, national_admin, provincial_admin, district_admin, zonal_admin) and the
-- frontend lets those roles generate draws — but the RLS policies on
-- competitions (INSERT/UPDATE) and fixtures (ALL) were never updated. They still
-- only permitted admin / super_admin / federation_official, so an HIC or coach
-- clicking "Generate Draw" was silently denied by RLS and nothing was created.
--
-- This centralises the organiser check in one SECURITY DEFINER helper and
-- rewrites the affected policies to use it.

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

COMMENT ON FUNCTION public.is_competition_organizer(uuid)
  IS 'True if the user holds any role permitted to create/manage competitions and fixtures.';

GRANT EXECUTE ON FUNCTION public.is_competition_organizer(uuid) TO authenticated;

-- ── competitions ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Officials create competitions" ON public.competitions;
CREATE POLICY "Officials create competitions"
  ON public.competitions FOR INSERT TO authenticated
  WITH CHECK (public.is_competition_organizer(auth.uid()));

DROP POLICY IF EXISTS "Officials update competitions" ON public.competitions;
CREATE POLICY "Officials update competitions"
  ON public.competitions FOR UPDATE TO authenticated
  USING (public.is_competition_organizer(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_competition_organizer(auth.uid()) OR created_by = auth.uid());

-- ── fixtures ────────────────────────────────────────────────────────
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
