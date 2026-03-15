
-- ====================================================
-- NEXUS FULL SCHEMA — Aetheris Innovative Enterprises
-- ====================================================

-- Utility: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ USER ROLES ============
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','federation_official','referee','scorer','broadcaster','athlete','team_manager','school_coordinator','viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  province TEXT,
  date_of_birth DATE,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ VENUES ============
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  capacity INTEGER,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  facilities TEXT[],
  equipment_inventory JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues viewable by all" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Admins manage venues" ON public.venues FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMPETITIONS ============
CREATE TYPE public.competition_level AS ENUM ('primary_school','secondary_school','club_academy','provincial','national_league','national_cup','international');
CREATE TYPE public.competition_status AS ENUM ('draft','registration_open','registration_closed','ongoing','completed','cancelled');
CREATE TYPE public.bracket_format AS ENUM ('round_robin','single_elimination','double_elimination','swiss','league','ladder','custom_heats');

CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  discipline TEXT NOT NULL,
  level public.competition_level NOT NULL,
  status public.competition_status NOT NULL DEFAULT 'draft',
  format public.bracket_format NOT NULL DEFAULT 'round_robin',
  province TEXT,
  season TEXT,
  start_date DATE,
  end_date DATE,
  registration_deadline DATE,
  venue_id UUID REFERENCES public.venues(id),
  description TEXT,
  rules JSONB DEFAULT '{}',
  max_participants INTEGER,
  entry_fee NUMERIC(10,2) DEFAULT 0,
  prize_pool NUMERIC(10,2) DEFAULT 0,
  sponsor TEXT,
  logo_url TEXT,
  is_broadcast BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Competitions viewable by all" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Officials create competitions" ON public.competitions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE POLICY "Officials update competitions" ON public.competitions FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR created_by = auth.uid());
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_competitions_parent ON public.competitions(parent_id);
CREATE INDEX idx_competitions_discipline ON public.competitions(discipline);
CREATE INDEX idx_competitions_level ON public.competitions(level);
CREATE INDEX idx_competitions_status ON public.competitions(status);

-- ============ TEAMS ============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  discipline TEXT NOT NULL,
  level public.competition_level,
  province TEXT,
  school_name TEXT,
  club_name TEXT,
  manager_id UUID REFERENCES auth.users(id),
  logo_url TEXT,
  kit_colors TEXT[],
  founded_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams viewable by all" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Managers manage own team" ON public.teams FOR ALL USING (auth.uid() = manager_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ATHLETES ============
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  province TEXT NOT NULL,
  school_name TEXT,
  club_name TEXT,
  disciplines TEXT[] NOT NULL,
  id_card_number TEXT UNIQUE,
  qr_code TEXT,
  nfc_tag TEXT,
  medical_waiver_signed BOOLEAN DEFAULT false,
  medical_waiver_date DATE,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  personal_bests JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes viewable by all" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "Athletes manage own record" ON public.athletes FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_athletes_disciplines ON public.athletes USING GIN(disciplines);
CREATE INDEX idx_athletes_province ON public.athletes(province);

-- ============ REGISTRATIONS ============
CREATE TYPE public.registration_status AS ENUM ('pending','approved','rejected','withdrawn','suspended');

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id),
  team_id UUID REFERENCES public.teams(id),
  registration_type TEXT NOT NULL CHECK (registration_type IN ('athlete','team','official')),
  status public.registration_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  seed_number INTEGER,
  division TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrations viewable by officials and self" ON public.registrations FOR SELECT USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE POLICY "Anyone can register" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Officials manage registrations" ON public.registrations FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR auth.uid() = submitted_by);
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FIXTURES ============
CREATE TYPE public.match_status AS ENUM ('scheduled','live','completed','postponed','cancelled','awarded');

CREATE TABLE public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  round_number INTEGER,
  round_label TEXT,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  home_athlete_id UUID REFERENCES public.athletes(id),
  away_athlete_id UUID REFERENCES public.athletes(id),
  venue_id UUID REFERENCES public.venues(id),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  home_score NUMERIC DEFAULT 0,
  away_score NUMERIC DEFAULT 0,
  period_scores JSONB DEFAULT '[]',
  extra_time_score JSONB,
  penalties_score JSONB,
  match_data JSONB DEFAULT '{}',
  winner_id UUID,
  referee_id UUID REFERENCES auth.users(id),
  scorer_id UUID REFERENCES auth.users(id),
  broadcast_url TEXT,
  is_broadcast BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fixtures viewable by all" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Officials manage fixtures" ON public.fixtures FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR auth.uid() = referee_id OR auth.uid() = scorer_id);
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON public.fixtures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_fixtures_competition ON public.fixtures(competition_id);
CREATE INDEX idx_fixtures_status ON public.fixtures(status);
CREATE INDEX idx_fixtures_scheduled ON public.fixtures(scheduled_at);

-- ============ STANDINGS ============
CREATE TABLE public.standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id),
  athlete_id UUID REFERENCES public.athletes(id),
  position INTEGER,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  score_for NUMERIC DEFAULT 0,
  score_against NUMERIC DEFAULT 0,
  score_diff NUMERIC GENERATED ALWAYS AS (score_for - score_against) STORED,
  bonus_points NUMERIC DEFAULT 0,
  points NUMERIC DEFAULT 0,
  form TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Standings viewable by all" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Officials update standings" ON public.standings FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR public.has_role(auth.uid(), 'scorer'));
CREATE INDEX idx_standings_competition ON public.standings(competition_id);

-- ============ SCORE ENTRIES ============
CREATE TABLE public.score_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  scorer_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  athlete_id UUID REFERENCES public.athletes(id),
  minute INTEGER,
  period TEXT,
  value NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.score_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Score entries viewable by all" ON public.score_entries FOR SELECT USING (true);
CREATE POLICY "Scorers submit entries" ON public.score_entries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'scorer') OR public.has_role(auth.uid(), 'referee') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_score_entries_fixture ON public.score_entries(fixture_id);
CREATE INDEX idx_score_entries_created ON public.score_entries(created_at DESC);

-- ============ OFFICIALS ============
CREATE TABLE public.officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  disciplines TEXT[] NOT NULL,
  qualifications TEXT[],
  certification_level TEXT,
  province TEXT,
  is_active BOOLEAN DEFAULT true,
  performance_rating NUMERIC(3,2),
  total_matches INTEGER DEFAULT 0,
  bank_account JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Officials viewable by admins" ON public.officials FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE POLICY "Admins manage officials" ON public.officials FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_officials_updated_at BEFORE UPDATE ON public.officials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DISCIPLINARY RECORDS ============
CREATE TYPE public.disciplinary_severity AS ENUM ('warning','yellow_card','red_card','suspension','ban','lifetime_ban');

CREATE TABLE public.disciplinary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.athletes(id),
  team_id UUID REFERENCES public.teams(id),
  official_id UUID REFERENCES public.officials(id),
  competition_id UUID REFERENCES public.competitions(id),
  fixture_id UUID REFERENCES public.fixtures(id),
  severity public.disciplinary_severity NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  issued_by UUID REFERENCES auth.users(id),
  suspension_games INTEGER DEFAULT 0,
  suspension_until DATE,
  is_active BOOLEAN DEFAULT true,
  appeal_status TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disciplinary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disciplinary viewable by admins" ON public.disciplinary_records FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR public.has_role(auth.uid(), 'referee'));
CREATE POLICY "Officials issue disciplinary" ON public.disciplinary_records FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR public.has_role(auth.uid(), 'referee'));
CREATE POLICY "Admins update disciplinary" ON public.disciplinary_records FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_disciplinary_updated_at BEFORE UPDATE ON public.disciplinary_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RECORDS & ACHIEVEMENTS ============
CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL,
  discipline TEXT NOT NULL,
  event_name TEXT NOT NULL,
  athlete_id UUID REFERENCES public.athletes(id),
  team_id UUID REFERENCES public.teams(id),
  value TEXT NOT NULL,
  unit TEXT,
  competition_id UUID REFERENCES public.competitions(id),
  fixture_id UUID REFERENCES public.fixtures(id),
  achieved_at TIMESTAMPTZ,
  province TEXT,
  age_group TEXT,
  gender TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  previous_record TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Records viewable by all" ON public.records FOR SELECT USING (true);
CREATE POLICY "Officials submit records" ON public.records FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR public.has_role(auth.uid(), 'scorer'));
CREATE INDEX idx_records_discipline ON public.records(discipline);
CREATE INDEX idx_records_type ON public.records(record_type);

-- ============ BROADCASTS ============
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID REFERENCES public.fixtures(id),
  competition_id UUID REFERENCES public.competitions(id),
  title TEXT NOT NULL,
  stream_url TEXT,
  thumbnail_url TEXT,
  quality TEXT DEFAULT 'HD',
  is_live BOOLEAN DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  platform TEXT,
  commentary_enabled BOOLEAN DEFAULT false,
  graphics_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Broadcasts viewable by all" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Broadcasters manage streams" ON public.broadcasts FOR ALL USING (public.has_role(auth.uid(), 'broadcaster') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER update_broadcasts_updated_at BEFORE UPDATE ON public.broadcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ JUDGE SCORES ============
CREATE TABLE public.judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES auth.users(id),
  athlete_id UUID REFERENCES public.athletes(id),
  team_id UUID REFERENCES public.teams(id),
  rubric JSONB NOT NULL DEFAULT '{}',
  total_score NUMERIC,
  is_anonymous BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Judges insert own scores" ON public.judge_scores FOR INSERT WITH CHECK (auth.uid() = judge_id AND (public.has_role(auth.uid(), 'referee') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins view all judge scores" ON public.judge_scores FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR auth.uid() = judge_id);

-- ============ POLLS ============
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID REFERENCES public.fixtures(id),
  competition_id UUID REFERENCES public.competitions(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by all" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Admins create polls" ON public.polls FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'broadcaster'));

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users vote once" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Votes viewable by all" ON public.poll_votes FOR SELECT USING (true);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============ VENUE BOOKINGS ============
CREATE TABLE public.venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id),
  competition_id UUID REFERENCES public.competitions(id),
  fixture_id UUID REFERENCES public.fixtures(id),
  booked_by UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings viewable by officials" ON public.venue_bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR auth.uid() = booked_by);
CREATE POLICY "Officials create bookings" ON public.venue_bookings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR auth.uid() = booked_by);
CREATE POLICY "Officials update bookings" ON public.venue_bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR auth.uid() = booked_by);

-- ============ OFFICIAL ASSIGNMENTS ============
CREATE TABLE public.official_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id UUID NOT NULL REFERENCES public.officials(id),
  fixture_id UUID REFERENCES public.fixtures(id),
  competition_id UUID REFERENCES public.competitions(id),
  role TEXT NOT NULL,
  status TEXT DEFAULT 'assigned',
  stipend NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.official_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments viewable by admins" ON public.official_assignments FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE POLICY "Admins manage assignments" ON public.official_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));

-- ============ ATHLETE TRANSFERS ============
CREATE TABLE public.athlete_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  from_team_id UUID REFERENCES public.teams(id),
  to_team_id UUID REFERENCES public.teams(id),
  from_division TEXT,
  to_division TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  transfer_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.athlete_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transfers viewable by admins" ON public.athlete_transfers FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official'));
CREATE POLICY "Officials submit transfers" ON public.athlete_transfers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'federation_official') OR public.has_role(auth.uid(), 'team_manager'));

-- ============ SPONSORSHIPS ============
CREATE TABLE public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id),
  sponsor_name TEXT NOT NULL,
  sponsor_logo TEXT,
  tier TEXT,
  amount NUMERIC(10,2),
  billboard_slots JSONB DEFAULT '[]',
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsorships viewable by admins" ON public.sponsorships FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage sponsorships" ON public.sponsorships FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ ENABLE REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixtures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.score_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.standings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
