-- WIPE
TRUNCATE TABLE
  athlete_transfers, athletes, broadcasts, competitions, disciplinary_records,
  fixtures, judge_scores, notifications, official_assignments, officials,
  poll_votes, polls, profiles, records, registrations, score_entries,
  sponsorships, standings, teams, user_roles, venue_bookings, venues
CASCADE;

-- EXTEND EXISTING TABLES
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS is_ss_linked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scholastic_card_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER,
  ADD COLUMN IF NOT EXISTS nexus_sport TEXT CHECK (nexus_sport IN ('handball','netball','both')),
  ADD COLUMN IF NOT EXISTS ss_school_id TEXT;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS is_ss_school BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sport TEXT CHECK (sport IN ('handball','netball','both','general'));

-- nexus_coaches
CREATE TABLE public.nexus_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  ss_school_id TEXT,
  school_name TEXT,
  is_ss_school BOOLEAN NOT NULL DEFAULT FALSE,
  disciplines TEXT[] NOT NULL DEFAULT '{}',
  gender TEXT,
  certification TEXT,
  id_number TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexus_coaches TO authenticated;
GRANT SELECT, INSERT ON public.nexus_coaches TO anon;
GRANT ALL ON public.nexus_coaches TO service_role;
ALTER TABLE public.nexus_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone submits coach registration" ON public.nexus_coaches
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Coach reads own row" ON public.nexus_coaches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Coach updates own row" ON public.nexus_coaches
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "HIC deletes coaches" ON public.nexus_coaches
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- team_sheets
CREATE TABLE public.team_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  submitted_by_user_id UUID,
  submitted_by_name TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN ('handball','netball')),
  age_group TEXT,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','revision_requested')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_sheets TO authenticated;
GRANT ALL ON public.team_sheets TO service_role;
ALTER TABLE public.team_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach inserts team sheet" ON public.team_sheets
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by_user_id = auth.uid() OR public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Coach reads own, HIC reads all" ON public.team_sheets
  FOR SELECT TO authenticated
  USING (submitted_by_user_id = auth.uid() OR public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "HIC updates team sheets" ON public.team_sheets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR submitted_by_user_id = auth.uid());
CREATE POLICY "HIC deletes team sheets" ON public.team_sheets
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- scholastic_card_verifications
CREATE TABLE public.scholastic_card_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ss_student_id TEXT NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  verified_by UUID,
  verification_method TEXT NOT NULL DEFAULT 'scholastic_card' CHECK (verification_method IN ('scholastic_card','manual_id','manual_confirm')),
  card_scan_data TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholastic_card_verifications TO authenticated;
GRANT ALL ON public.scholastic_card_verifications TO service_role;
ALTER TABLE public.scholastic_card_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HIC manages verifications" ON public.scholastic_card_verifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- ss_sync_log
CREATE TABLE public.ss_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('schools','students','full')),
  schools_synced INTEGER NOT NULL DEFAULT 0,
  students_synced INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success','failed','partial')),
  error_message TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ss_sync_log TO authenticated;
GRANT ALL ON public.ss_sync_log TO service_role;
ALTER TABLE public.ss_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HIC reads sync log" ON public.ss_sync_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'hic') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- nexus_student_activity (public read)
CREATE TABLE public.nexus_student_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ss_student_id TEXT NOT NULL,
  ss_school_id TEXT,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('handball','netball')),
  competition_name TEXT,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  fixture_id UUID REFERENCES public.fixtures(id) ON DELETE SET NULL,
  description TEXT,
  value NUMERIC,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nexus_student_activity TO anon, authenticated;
GRANT ALL ON public.nexus_student_activity TO service_role;
ALTER TABLE public.nexus_student_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads student activity" ON public.nexus_student_activity
  FOR SELECT TO anon, authenticated USING (true);

-- view for Scholastic Services
CREATE OR REPLACE VIEW public.nexus_student_sports_profile AS
SELECT
  a.external_student_id AS ss_student_id,
  a.display_name AS player_name,
  a.ss_school_id,
  a.disciplines,
  a.nexus_sport,
  a.scholastic_card_verified,
  a.is_ss_linked,
  a.photo_url,
  COUNT(DISTINCT se.fixture_id) AS matches_played,
  COALESCE(SUM(CASE WHEN se.event_type = 'goal' THEN 1 ELSE 0 END), 0) AS goals_scored
FROM public.athletes a
LEFT JOIN public.score_entries se ON se.athlete_id = a.id
WHERE a.is_ss_linked = TRUE
GROUP BY a.id;
GRANT SELECT ON public.nexus_student_sports_profile TO anon, authenticated;

-- indexes
CREATE INDEX IF NOT EXISTS idx_athletes_ss_school_id ON public.athletes(ss_school_id);
CREATE INDEX IF NOT EXISTS idx_athletes_nexus_sport ON public.athletes(nexus_sport);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON public.teams(sport);
CREATE INDEX IF NOT EXISTS idx_team_sheets_team ON public.team_sheets(team_id);
CREATE INDEX IF NOT EXISTS idx_team_sheets_competition ON public.team_sheets(competition_id);
CREATE INDEX IF NOT EXISTS idx_activity_student ON public.nexus_student_activity(ss_student_id);
CREATE INDEX IF NOT EXISTS idx_activity_school ON public.nexus_student_activity(ss_school_id);
CREATE INDEX IF NOT EXISTS idx_coaches_user ON public.nexus_coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_school ON public.nexus_coaches(ss_school_id);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_nexus_coaches_updated_at ON public.nexus_coaches;
CREATE TRIGGER trg_nexus_coaches_updated_at
  BEFORE UPDATE ON public.nexus_coaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_team_sheets_updated_at ON public.team_sheets;
CREATE TRIGGER trg_team_sheets_updated_at
  BEFORE UPDATE ON public.team_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();