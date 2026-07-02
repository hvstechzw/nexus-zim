-- Fixes two concrete bugs reported after the NASH/NAPH role rollout:
--
-- 1. "Competitions deleting isn't deleting" — public.competitions has
--    SELECT/INSERT/UPDATE policies but NO delete policy at all. With RLS
--    enabled, a DELETE that matches no policy affects zero rows and
--    returns success (no error) — so the UI's confirm+delete flow "worked"
--    from the client's point of view but silently deleted nothing, for
--    every role including super_admin. Same latent gap existed on
--    registrations and score_entries (used to cascade-clean a competition
--    or fixture before deleting it) and on teams/officials/broadcasts/
--    sponsorships (which only ever allowed legacy admin/super_admin or an
--    owner id, never the newer NASH/NAPH admin-tier roles).
--
-- 2. "Role assignment isn't working for new roles" — user_roles,
--    role_requests and region_admin_assignments only ever checked
--    has_role(admin) OR has_role(super_admin) for management actions.
--    platform_admin (the new top-tier role, conceptually equivalent to
--    super_admin) and nash_national/naph_national were never recognized,
--    so signing in as one of the seeded NASH-native accounts and trying
--    to grant a role, or approve a role/region request, was silently
--    denied by RLS.

-- ── is_competition_organizer(): bring it in line with the client-side
-- ORGANIZER_ROLES list (src/hooks/useHasRole.ts) — it was missing
-- platform_admin, nash_national, naph_national and the technical-director /
-- competition_organiser roles added since it was first written, which is
-- exactly the "UI shows the button, DB silently rejects it" gap this
-- migration is closing.
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
    OR public.has_role(_uid, 'platform_admin')
    OR public.has_role(_uid, 'federation_official')
    OR public.has_role(_uid, 'nash_national')
    OR public.has_role(_uid, 'naph_national')
    OR public.has_role(_uid, 'national_admin')
    OR public.has_role(_uid, 'national_technical_director')
    OR public.has_role(_uid, 'provincial_admin')
    OR public.has_role(_uid, 'provincial_technical_director')
    OR public.has_role(_uid, 'district_admin')
    OR public.has_role(_uid, 'district_technical_director')
    OR public.has_role(_uid, 'zonal_admin')
    OR public.has_role(_uid, 'competition_organiser')
    OR public.has_role(_uid, 'hic')
    OR public.has_role(_uid, 'coach');
$$;

-- ── competitions: add the missing DELETE policy ─────────────────────
DROP POLICY IF EXISTS "Organisers delete competitions" ON public.competitions;
CREATE POLICY "Organisers delete competitions"
  ON public.competitions FOR DELETE TO authenticated
  USING (public.is_competition_organizer(auth.uid()) OR created_by = auth.uid());

-- ── registrations: add the missing DELETE policy (used when cascading
-- a competition/fixture delete) ─────────────────────────────────────
DROP POLICY IF EXISTS "Organisers delete registrations" ON public.registrations;
CREATE POLICY "Organisers delete registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (public.is_competition_organizer(auth.uid()) OR auth.uid() = submitted_by);

-- ── score_entries: add the missing DELETE policy (same cascade need) ─
DROP POLICY IF EXISTS "Organisers delete score entries" ON public.score_entries;
CREATE POLICY "Organisers delete score entries"
  ON public.score_entries FOR DELETE TO authenticated
  USING (public.is_competition_organizer(auth.uid()));

-- ── teams (schools), officials, broadcasts, sponsorships: widen the
-- existing "admin/super_admin only" FOR ALL policies to the full
-- organiser tier so the delete buttons added to /admin actually work
-- for provincial/district/zonal/platform admins, not just legacy roles ─
DROP POLICY IF EXISTS "Managers manage own team" ON public.teams;
CREATE POLICY "Managers manage own team"
  ON public.teams FOR ALL TO authenticated
  USING (auth.uid() = manager_id OR public.is_competition_organizer(auth.uid()))
  WITH CHECK (auth.uid() = manager_id OR public.is_competition_organizer(auth.uid()));

DROP POLICY IF EXISTS "Admins manage officials" ON public.officials;
CREATE POLICY "Admins manage officials"
  ON public.officials FOR ALL TO authenticated
  USING (public.is_competition_organizer(auth.uid()))
  WITH CHECK (public.is_competition_organizer(auth.uid()));

DROP POLICY IF EXISTS "Broadcasters manage streams" ON public.broadcasts;
CREATE POLICY "Broadcasters manage streams"
  ON public.broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'broadcaster') OR public.is_competition_organizer(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'broadcaster') OR public.is_competition_organizer(auth.uid()));

DROP POLICY IF EXISTS "Admins manage sponsorships" ON public.sponsorships;
CREATE POLICY "Admins manage sponsorships"
  ON public.sponsorships FOR ALL TO authenticated
  USING (public.is_competition_organizer(auth.uid()))
  WITH CHECK (public.is_competition_organizer(auth.uid()));
DROP POLICY IF EXISTS "Sponsorships viewable by admins" ON public.sponsorships;
CREATE POLICY "Sponsorships viewable by all"
  ON public.sponsorships FOR SELECT USING (true);

-- ── user_roles / role_requests / region_admin_assignments: recognize
-- platform_admin, nash_national and naph_national as top-tier admins,
-- not just the legacy admin/super_admin role names ──────────────────
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.nash_is_admin(auth.uid()))
  WITH CHECK (public.nash_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users see own role requests" ON public.role_requests;
CREATE POLICY "Users see own role requests"
  ON public.role_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.nash_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage role requests" ON public.role_requests;
CREATE POLICY "Admins manage role requests"
  ON public.role_requests FOR UPDATE TO authenticated
  USING (public.nash_is_admin(auth.uid()))
  WITH CHECK (public.nash_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete role requests" ON public.role_requests;
CREATE POLICY "Admins delete role requests"
  ON public.role_requests FOR DELETE TO authenticated
  USING (public.nash_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage assignments" ON public.region_admin_assignments;
CREATE POLICY "Admins manage assignments"
  ON public.region_admin_assignments FOR ALL TO authenticated
  USING (public.nash_is_admin(auth.uid()))
  WITH CHECK (public.nash_is_admin(auth.uid()));

-- ── NAPH organisation mirror ─────────────────────────────────────────
-- 20260628120200_nash_seed_data.sql only ever seeded NASH's national +
-- provincial organisations, leaving NAPH (primary schools) with no
-- organisation tree at all despite the app claiming to serve both
-- federations equally. Mirrors the same national + 10 provincial shape.
INSERT INTO public.nash_organisations (type, level, name, is_active)
SELECT 'naph','national','NAPH National Office', true
WHERE NOT EXISTS (SELECT 1 FROM public.nash_organisations WHERE type='naph' AND level='national');

INSERT INTO public.nash_organisations (type, level, name, province, parent_id, is_active)
SELECT 'naph','provincial', prov || ' Primary Schools Sports Association', prov,
       (SELECT id FROM public.nash_organisations WHERE type='naph' AND level='national' LIMIT 1),
       true
FROM (VALUES
  ('Harare'),('Bulawayo'),('Manicaland'),('Mashonaland Central'),
  ('Mashonaland East'),('Mashonaland West'),('Masvingo'),
  ('Matabeleland North'),('Matabeleland South'),('Midlands')
) AS p(prov)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nash_organisations o
  WHERE o.type='naph' AND o.level='provincial' AND o.province = p.prov
);
