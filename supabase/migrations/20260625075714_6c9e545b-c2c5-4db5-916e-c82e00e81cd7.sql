
-- 1) school_teams: a publishable team a school fields in a discipline
CREATE TABLE IF NOT EXISTS public.school_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  discipline text NOT NULL,
  age_group text,
  gender text,
  name text NOT NULL,
  season text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, discipline, age_group, gender, season)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_teams TO authenticated;
GRANT ALL ON public.school_teams TO service_role;
ALTER TABLE public.school_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published school teams visible to signed-in users"
  ON public.school_teams FOR SELECT TO authenticated
  USING (
    is_published = true
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'hic')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Coaches/HIC/admin manage school teams"
  ON public.school_teams FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'coach')
    OR has_role(auth.uid(), 'hic')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    has_role(auth.uid(), 'coach')
    OR has_role(auth.uid(), 'hic')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER trg_school_teams_updated
  BEFORE UPDATE ON public.school_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) school_team_players: roster
CREATE TABLE IF NOT EXISTS public.school_team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_team_id uuid NOT NULL REFERENCES public.school_teams(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  jersey_number integer,
  position text,
  is_captain boolean NOT NULL DEFAULT false,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_team_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_team_players TO authenticated;
GRANT ALL ON public.school_team_players TO service_role;
ALTER TABLE public.school_team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roster of published teams visible to signed-in users"
  ON public.school_team_players FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_teams st
      WHERE st.id = school_team_id
        AND (
          st.is_published = true
          OR st.created_by = auth.uid()
          OR has_role(auth.uid(), 'hic')
          OR has_role(auth.uid(), 'admin')
          OR has_role(auth.uid(), 'super_admin')
        )
    )
  );

CREATE POLICY "Coaches/HIC/admin manage rosters"
  ON public.school_team_players FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_teams st
      WHERE st.id = school_team_id
        AND (
          st.created_by = auth.uid()
          OR has_role(auth.uid(), 'hic')
          OR has_role(auth.uid(), 'admin')
          OR has_role(auth.uid(), 'super_admin')
        )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'coach')
    OR has_role(auth.uid(), 'hic')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'super_admin')
  );

-- 3) Fixtures: reference actual school teams (keep school columns for back-compat)
ALTER TABLE public.fixtures
  ADD COLUMN IF NOT EXISTS home_school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS away_school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL;

-- 4) Lock down athletes: no anonymous browsing. Authenticated users can read
-- non-sensitive fields; UI must only surface athletes via published rosters.
DROP POLICY IF EXISTS "Athletes viewable by all" ON public.athletes;
CREATE POLICY "Athletes viewable by authenticated users"
  ON public.athletes FOR SELECT TO authenticated
  USING (true);
