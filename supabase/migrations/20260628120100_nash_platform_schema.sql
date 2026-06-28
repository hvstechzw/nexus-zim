-- ════════════════════════════════════════════════════════════════
-- NASH OVERHAUL — Step 1b: platform schema
-- ════════════════════════════════════════════════════════════════
-- Creates the NASH/NAPH competition-management schema and extends existing
-- tables. Additive and non-destructive: existing tables/columns/policies are
-- preserved; new columns use ADD COLUMN IF NOT EXISTS.
--
-- RLS note: every new table has RLS enabled. Baseline policies here are:
--   • public-readable reference/results tables  → readable by everyone
--   • PII / operational tables                  → readable by authenticated users
--   • writes                                    → admin-tier roles (nash_is_admin)
-- Fine-grained province/district row scoping is layered on in a follow-up
-- migration once the user→organisation membership map exists.

-- ── Admin-tier helper ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nash_is_admin(_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user
      AND role IN ('super_admin','admin','platform_admin','nash_national','naph_national')
  );
$$;

-- ════════════════════════════════════════════════════════════════
-- ORGANISATION STRUCTURE
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('nash','naph')),
  level text CHECK (level IN ('national','provincial','district','zonal')),
  name text NOT NULL,
  province text,
  district text,
  zone text,
  parent_id uuid REFERENCES public.nash_organisations(id) ON DELETE SET NULL,
  chair_name text,
  secretary_name text,
  treasurer_name text,
  email text,
  phone text,
  physical_address text,
  established_year integer,
  is_active boolean DEFAULT true,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nash_org_parent ON public.nash_organisations(parent_id);
CREATE INDEX IF NOT EXISTS idx_nash_org_level ON public.nash_organisations(type, level);

CREATE TABLE IF NOT EXISTS public.nash_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES public.nash_organisations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role_title text NOT NULL,
  sports text[],
  id_number text,
  photo_url text,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  term_start date,
  term_end date,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nash_members_org ON public.nash_members(organisation_id);

-- ════════════════════════════════════════════════════════════════
-- SEASONS, SPORTS, TIERS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,
  term integer CHECK (term IN (1,2,3)),
  name text,
  start_date date,
  end_date date,
  registration_deadline date,
  is_active boolean DEFAULT false,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nash_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  full_name text,
  gender text CHECK (gender IN ('boys','girls','mixed','both')),
  applicable_to text[] DEFAULT ARRAY['secondary'],
  scoring_type text CHECK (scoring_type IN (
    'goals_halves','goals_quarters','points_quarters',
    'sets_games','time_based','position_based',
    'runs_wickets','tries_conversions','rally_scoring'
  )),
  periods integer,
  period_duration_minutes integer,
  has_extra_time boolean DEFAULT false,
  has_penalties boolean DEFAULT false,
  has_suspension boolean DEFAULT false,
  age_groups text[] DEFAULT ARRAY['U16','U18','Open'],
  primary_term integer,
  secondary_term integer,
  min_squad_size integer,
  max_squad_size integer,
  players_on_field integer,
  scoring_config jsonb DEFAULT '{}',
  rules_document_url text,
  icon_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nash_competition_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text,
  level_order integer,
  advances_count integer,
  requires_card_verification boolean DEFAULT false,
  requires_ss_integration boolean DEFAULT false,
  min_ss_package text
);

-- ════════════════════════════════════════════════════════════════
-- ATHLETE NATIONAL REGISTRY
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_athlete_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nash_id text UNIQUE NOT NULL,
  ss_student_id text,
  scholastic_card_number text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text CHECK (gender IN ('male','female')),
  id_number text,
  id_verified boolean DEFAULT false,
  id_document_url text,
  photo_url text,
  current_school_id uuid,
  current_school_name text,
  province text,
  is_active boolean DEFAULT true,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  suspension_until date,
  lifetime_ban boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nash_athlete_name_dob ON public.nash_athlete_registry(lower(last_name), lower(first_name), date_of_birth);
CREATE INDEX IF NOT EXISTS idx_nash_athlete_ss ON public.nash_athlete_registry(ss_student_id);

CREATE TABLE IF NOT EXISTS public.nash_athlete_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nash_athlete_id uuid REFERENCES public.nash_athlete_registry(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.nash_seasons(id),
  sport_id uuid REFERENCES public.nash_sports(id),
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE CASCADE,
  jersey_number integer,
  position text,
  age_group text,
  is_captain boolean DEFAULT false,
  academic_eligible boolean DEFAULT true,
  academic_check_date date,
  academic_checked_by text,
  medical_cleared boolean DEFAULT false,
  medical_clearance_date date,
  medical_cleared_by text,
  medical_notes text,
  parental_consent boolean DEFAULT false,
  consent_document_url text,
  registration_status text CHECK (registration_status IN (
    'pending','approved','rejected','suspended','withdrawn'
  )) DEFAULT 'pending',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nash_reg_athlete ON public.nash_athlete_registrations(nash_athlete_id);
CREATE INDEX IF NOT EXISTS idx_nash_reg_team ON public.nash_athlete_registrations(school_team_id);
CREATE INDEX IF NOT EXISTS idx_nash_reg_season_sport ON public.nash_athlete_registrations(season_id, sport_id);

CREATE TABLE IF NOT EXISTS public.nash_eligibility_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nash_athlete_id uuid REFERENCES public.nash_athlete_registry(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.nash_athlete_registrations(id) ON DELETE CASCADE,
  flag_type text CHECK (flag_type IN (
    'overage','dual_enrollment','academic_fail',
    'medical_unfit','suspended','fake_id','other'
  )),
  description text,
  raised_by text,
  raised_at timestamptz DEFAULT now(),
  status text DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_by text,
  resolved_at timestamptz,
  resolution_notes text
);
CREATE INDEX IF NOT EXISTS idx_nash_flags_status ON public.nash_eligibility_flags(status);

-- ════════════════════════════════════════════════════════════════
-- OFFICIALS REGISTRY
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nash_official_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text,
  date_of_birth date,
  id_number text,
  photo_url text,
  province text,
  district text,
  email text,
  phone text,
  sports text[] NOT NULL DEFAULT ARRAY[]::text[],
  primary_role text CHECK (primary_role IN (
    'referee','assistant_referee','umpire','scorer',
    'timekeeper','starter','field_judge','track_judge',
    'technical_delegate','doping_officer','medical_officer'
  )),
  other_roles text[],
  grade text CHECK (grade IN ('A','B','C','trainee')),
  certification_body text DEFAULT 'NASH',
  certification_date date,
  certification_expiry date,
  total_matches integer DEFAULT 0,
  performance_rating numeric(3,1),
  bank_name text,
  account_number text,
  account_name text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nash_officials_prov ON public.nash_officials(province, district);

-- ════════════════════════════════════════════════════════════════
-- FINANCE
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_competition_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  total_budget numeric(10,2) DEFAULT 0,
  entry_fees_collected numeric(10,2) DEFAULT 0,
  sponsorship_received numeric(10,2) DEFAULT 0,
  official_stipends numeric(10,2) DEFAULT 0,
  venue_costs numeric(10,2) DEFAULT 0,
  catering_costs numeric(10,2) DEFAULT 0,
  equipment_costs numeric(10,2) DEFAULT 0,
  transport_costs numeric(10,2) DEFAULT 0,
  printing_costs numeric(10,2) DEFAULT 0,
  other_costs numeric(10,2) DEFAULT 0,
  surplus_deficit numeric(10,2) GENERATED ALWAYS AS (
    entry_fees_collected + sponsorship_received
    - official_stipends - venue_costs - catering_costs
    - equipment_costs - transport_costs - printing_costs - other_costs
  ) STORED,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nash_entry_fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL,
  amount numeric(10,2),
  payment_method text CHECK (payment_method IN (
    'cash','ecocash','zipit','innbucks','bank_transfer','cheque'
  )),
  payment_reference text,
  payment_date date,
  received_by text,
  receipt_number text,
  nexus_fee_15pct numeric(10,2) GENERATED ALWAYS AS (amount * 0.15) STORED,
  organiser_amount numeric(10,2) GENERATED ALWAYS AS (amount * 0.85) STORED,
  nexus_fee_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- ATHLETICS (event-based scoring)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.athletics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_type text CHECK (event_type IN ('track','field','road')),
  gender text CHECK (gender IN ('boys','girls','mixed')),
  age_group text,
  has_heats boolean DEFAULT false,
  has_semifinals boolean DEFAULT false,
  final_places integer DEFAULT 8,
  unit text,
  wind_legal_limit numeric,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.athletics_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.athletics_events(id) ON DELETE CASCADE,
  nash_athlete_id uuid REFERENCES public.nash_athlete_registry(id) ON DELETE SET NULL,
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL,
  round text DEFAULT 'final',
  lane_or_bib integer,
  performance text NOT NULL,
  wind_reading numeric,
  position integer,
  points_earned integer,
  is_record boolean DEFAULT false,
  record_type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_athletics_results_event ON public.athletics_results(event_id);

-- ════════════════════════════════════════════════════════════════
-- AWARDS, REPORTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nash_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.nash_seasons(id),
  award_type text CHECK (award_type IN (
    'champion','runner_up','third_place',
    'best_player','top_scorer','best_goalkeeper',
    'best_coach','fair_play','most_improved',
    'outstanding_official','golden_boot','golden_glove'
  )),
  sport_id uuid REFERENCES public.nash_sports(id),
  nash_athlete_id uuid REFERENCES public.nash_athlete_registry(id) ON DELETE SET NULL,
  team_id uuid,
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL,
  coach_id uuid,
  official_id uuid REFERENCES public.nash_officials(id) ON DELETE SET NULL,
  award_name text,
  description text,
  trophy_returned boolean DEFAULT false,
  trophy_due_date date,
  certificate_url text,
  awarded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nash_mopse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.nash_seasons(id),
  report_type text DEFAULT 'annual',
  submitted_by text,
  submitted_at timestamptz,
  report_data jsonb,
  pdf_url text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- EXTEND EXISTING TABLES
-- ════════════════════════════════════════════════════════════════
-- venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS school_id uuid;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS nash_approved boolean DEFAULT false;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS surface_type text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS sports_supported text[];
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS has_changing_rooms boolean;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS has_medical_room boolean;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS has_spectator_seating boolean;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS spectator_capacity integer;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS has_floodlights boolean;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS booking_notes text;

-- competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS nash_sport_id uuid REFERENCES public.nash_sports(id);
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.nash_seasons(id);
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.nash_organisations(id);
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('zonal','district','provincial','national'));
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS age_group text CHECK (age_group IN ('U14','U16','U18','Open'));
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('boys','girls','mixed'));
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS host_school_id uuid;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS host_school_name text;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS technical_delegate_id uuid REFERENCES public.nash_officials(id);
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS requires_card_verification boolean DEFAULT false;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS entry_fee_per_team numeric(10,2) DEFAULT 0;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS total_entries integer DEFAULT 0;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS weather_conditions text;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS match_report_url text;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS is_nash_sanctioned boolean DEFAULT false;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS nash_sanction_number text;

-- athletes
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS nash_athlete_id uuid REFERENCES public.nash_athlete_registry(id);
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS nash_id text;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS form_level text;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS academic_year text;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS medical_cleared boolean DEFAULT false;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS parental_consent boolean DEFAULT false;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS dual_enrollment_flagged boolean DEFAULT false;

-- ss_sync_log
ALTER TABLE public.ss_sync_log ADD COLUMN IF NOT EXISTS sport text;
ALTER TABLE public.ss_sync_log ADD COLUMN IF NOT EXISTS season_id uuid;
ALTER TABLE public.ss_sync_log ADD COLUMN IF NOT EXISTS eligibility_checks_run integer DEFAULT 0;
ALTER TABLE public.ss_sync_log ADD COLUMN IF NOT EXISTS flags_raised integer DEFAULT 0;

-- match_events: sport awareness for the multi-sport scoring engine
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS sport_code text;

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.nash_organisations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_seasons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_sports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_competition_tiers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_athlete_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_athlete_registrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_eligibility_flags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_officials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_competition_budgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_entry_fee_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletics_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletics_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_awards                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nash_mopse_reports          ENABLE ROW LEVEL SECURITY;

-- Public-readable reference & results tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nash_organisations','nash_seasons','nash_sports','nash_competition_tiers',
    'athletics_events','athletics_results','nash_awards'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_public_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t||'_public_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_admin_write', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (public.nash_is_admin(auth.uid())) WITH CHECK (public.nash_is_admin(auth.uid()))', t||'_admin_write', t);
  END LOOP;
END $$;

-- Authenticated-readable (PII / operational) tables; writes admin-tier
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nash_members','nash_athlete_registry','nash_athlete_registrations',
    'nash_eligibility_flags','nash_officials','nash_competition_budgets',
    'nash_entry_fee_payments','nash_mopse_reports'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_auth_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', t||'_auth_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_admin_write', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (public.nash_is_admin(auth.uid())) WITH CHECK (public.nash_is_admin(auth.uid()))', t||'_admin_write', t);
  END LOOP;
END $$;
