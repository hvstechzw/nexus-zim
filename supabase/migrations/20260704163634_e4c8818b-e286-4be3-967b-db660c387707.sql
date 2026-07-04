
-- Let any authenticated user submit a DRAFT school team (is_published=false, they own it) — admins/HIC still publish/approve.
DROP POLICY IF EXISTS "Users submit draft school teams" ON public.school_teams;
CREATE POLICY "Users submit draft school teams" ON public.school_teams
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_published = false);

DROP POLICY IF EXISTS "Users update own draft school teams" ON public.school_teams;
CREATE POLICY "Users update own draft school teams" ON public.school_teams
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND is_published = false)
  WITH CHECK (created_by = auth.uid() AND is_published = false);

-- Any signed-in user may propose a school row (teams table) they will manage.
DROP POLICY IF EXISTS "Users create teams they manage" ON public.teams;
CREATE POLICY "Users create teams they manage" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (manager_id = auth.uid());

-- Owner + admin can add players to their own draft roster.
DROP POLICY IF EXISTS "Owners add players to own draft rosters" ON public.school_team_players;
CREATE POLICY "Owners add players to own draft rosters" ON public.school_team_players
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.school_teams st WHERE st.id = school_team_id AND st.created_by = auth.uid())
    OR has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'hic'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );
