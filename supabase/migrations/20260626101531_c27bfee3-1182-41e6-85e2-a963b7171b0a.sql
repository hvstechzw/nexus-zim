
-- Phase 1: Match Engine 2.0

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  period text NOT NULL DEFAULT 'Q1',
  clock_seconds integer NOT NULL DEFAULT 0,
  team_side text NOT NULL CHECK (team_side IN ('home','away','neutral')),
  player_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  assist_player_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  sub_type text,
  value numeric NOT NULL DEFAULT 0,
  x numeric,
  y numeric,
  notes text,
  is_void boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_events_fixture_seq ON public.match_events(fixture_id, sequence);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON public.match_events(player_id);
GRANT SELECT ON public.match_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read match events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "Scorers can insert match events" ON public.match_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'scorer') OR public.has_role(auth.uid(),'hic') OR
    public.has_role(auth.uid(),'umpire') OR public.has_role(auth.uid(),'referee') OR
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );
CREATE POLICY "Scorers can void own events" ON public.match_events FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.match_commentary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.match_events(id) ON DELETE CASCADE,
  text text NOT NULL,
  tone text NOT NULL DEFAULT 'info' CHECK (tone IN ('info','highlight','critical')),
  auto_generated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commentary_fixture ON public.match_commentary(fixture_id, created_at DESC);
GRANT SELECT ON public.match_commentary TO anon;
GRANT SELECT, INSERT ON public.match_commentary TO authenticated;
GRANT ALL ON public.match_commentary TO service_role;
ALTER TABLE public.match_commentary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read commentary" ON public.match_commentary FOR SELECT USING (true);
CREATE POLICY "Scorers can post commentary" ON public.match_commentary FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'scorer') OR public.has_role(auth.uid(),'hic') OR
    public.has_role(auth.uid(),'umpire') OR public.has_role(auth.uid(),'referee') OR
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );

CREATE TABLE IF NOT EXISTS public.match_state (
  fixture_id uuid PRIMARY KEY REFERENCES public.fixtures(id) ON DELETE CASCADE,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'Q1',
  clock_seconds integer NOT NULL DEFAULT 0,
  clock_running boolean NOT NULL DEFAULT false,
  possession text,
  home_on_court jsonb NOT NULL DEFAULT '[]'::jsonb,
  away_on_court jsonb NOT NULL DEFAULT '[]'::jsonb,
  suspensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_event_id uuid REFERENCES public.match_events(id) ON DELETE SET NULL,
  mvp_player_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  win_prob_home numeric NOT NULL DEFAULT 0.5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.match_state TO anon;
GRANT SELECT, INSERT, UPDATE ON public.match_state TO authenticated;
GRANT ALL ON public.match_state TO service_role;
ALTER TABLE public.match_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read match state" ON public.match_state FOR SELECT USING (true);
CREATE POLICY "Scorers can write match state" ON public.match_state FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'scorer') OR public.has_role(auth.uid(),'hic') OR
    public.has_role(auth.uid(),'umpire') OR public.has_role(auth.uid(),'referee') OR
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'scorer') OR public.has_role(auth.uid(),'hic') OR
    public.has_role(auth.uid(),'umpire') OR public.has_role(auth.uid(),'referee') OR
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  );

-- Recompute trigger: on event change, rebuild fixture state + scores
CREATE OR REPLACE FUNCTION public.recompute_match_state(_fixture_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home integer;
  v_away integer;
  v_last uuid;
  v_period text;
  v_clock integer;
  v_total_events integer;
  v_diff integer;
  v_win_home numeric;
  v_mvp uuid;
BEGIN
  SELECT
    COALESCE(SUM(value) FILTER (WHERE team_side='home' AND NOT is_void),0)::int,
    COALESCE(SUM(value) FILTER (WHERE team_side='away' AND NOT is_void),0)::int
  INTO v_home, v_away
  FROM public.match_events
  WHERE fixture_id = _fixture_id AND event_type IN ('goal','penalty_goal','seven_meter_goal');

  SELECT id, period, clock_seconds
  INTO v_last, v_period, v_clock
  FROM public.match_events
  WHERE fixture_id = _fixture_id AND NOT is_void
  ORDER BY sequence DESC LIMIT 1;

  SELECT count(*) INTO v_total_events FROM public.match_events WHERE fixture_id = _fixture_id AND NOT is_void;
  v_diff := v_home - v_away;
  v_win_home := GREATEST(0.02, LEAST(0.98, 0.5 + (v_diff::numeric * 0.05)));

  -- Naive MVP: top scorer + 2x assists
  SELECT player_id INTO v_mvp FROM (
    SELECT player_id, SUM(CASE WHEN event_type IN ('goal','penalty_goal','seven_meter_goal') THEN value
                               WHEN event_type='assist' THEN 0.5 ELSE 0 END) AS score
    FROM public.match_events
    WHERE fixture_id = _fixture_id AND NOT is_void AND player_id IS NOT NULL
    GROUP BY player_id ORDER BY score DESC NULLS LAST LIMIT 1
  ) m;

  INSERT INTO public.match_state (fixture_id, home_score, away_score, period, clock_seconds, last_event_id, mvp_player_id, win_prob_home, updated_at)
  VALUES (_fixture_id, v_home, v_away, COALESCE(v_period,'Q1'), COALESCE(v_clock,0), v_last, v_mvp, v_win_home, now())
  ON CONFLICT (fixture_id) DO UPDATE SET
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    period = EXCLUDED.period,
    clock_seconds = EXCLUDED.clock_seconds,
    last_event_id = EXCLUDED.last_event_id,
    mvp_player_id = EXCLUDED.mvp_player_id,
    win_prob_home = EXCLUDED.win_prob_home,
    updated_at = now();

  UPDATE public.fixtures SET home_score = v_home, away_score = v_away, updated_at = now()
  WHERE id = _fixture_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_match_events_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fid uuid;
  v_player_name text;
  v_team text;
  v_state record;
  v_text text;
  v_tone text;
  v_evt record;
BEGIN
  v_evt := COALESCE(NEW, OLD);
  v_fid := v_evt.fixture_id;
  PERFORM public.recompute_match_state(v_fid);

  IF TG_OP = 'INSERT' AND NEW.event_type IN ('goal','penalty_goal','seven_meter_goal','card','suspension') THEN
    SELECT COALESCE(NULLIF(display_name,''), first_name || ' ' || LEFT(last_name,1) || '.') INTO v_player_name
    FROM public.athletes WHERE id = NEW.player_id;
    SELECT * INTO v_state FROM public.match_state WHERE fixture_id = v_fid;
    v_team := CASE WHEN NEW.team_side='home' THEN 'Home' ELSE 'Away' END;
    v_tone := CASE WHEN NEW.event_type IN ('goal','penalty_goal','seven_meter_goal') THEN 'highlight'
                   WHEN NEW.event_type IN ('card','suspension') THEN 'critical'
                   ELSE 'info' END;
    v_text := CASE
      WHEN NEW.event_type='goal' THEN format('GOAL! %s — %s %s-%s, %s', COALESCE(v_player_name,'Team goal'), v_team, v_state.home_score, v_state.away_score, NEW.period)
      WHEN NEW.event_type='penalty_goal' THEN format('PENALTY GOAL! %s — %s %s-%s', COALESCE(v_player_name,v_team), v_team, v_state.home_score, v_state.away_score)
      WHEN NEW.event_type='seven_meter_goal' THEN format('7m GOAL! %s converts.', COALESCE(v_player_name,v_team))
      WHEN NEW.event_type='card' THEN format('%s CARD — %s (%s)', UPPER(COALESCE(NEW.sub_type,'YELLOW')), COALESCE(v_player_name,v_team), v_team)
      WHEN NEW.event_type='suspension' THEN format('2-min suspension — %s (%s)', COALESCE(v_player_name,v_team), v_team)
      ELSE NEW.event_type
    END;
    INSERT INTO public.match_commentary (fixture_id, event_id, text, tone, auto_generated)
    VALUES (v_fid, NEW.id, v_text, v_tone, true);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_events_after ON public.match_events;
CREATE TRIGGER trg_match_events_after
AFTER INSERT OR UPDATE OR DELETE ON public.match_events
FOR EACH ROW EXECUTE FUNCTION public.tg_match_events_after();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_commentary;
