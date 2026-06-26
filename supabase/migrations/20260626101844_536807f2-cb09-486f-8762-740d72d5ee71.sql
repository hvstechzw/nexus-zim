
CREATE OR REPLACE VIEW public.vw_player_career AS
SELECT
  e.player_id AS athlete_id,
  COUNT(DISTINCT e.fixture_id) FILTER (WHERE NOT e.is_void) AS matches,
  COALESCE(SUM(e.value) FILTER (WHERE NOT e.is_void AND e.value > 0),0)::int AS goals,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type = 'assist')::int AS assists,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('miss','miss_7m'))::int AS misses,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('intercept','steal'))::int AS intercepts,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('turnover','technical_fault','footwork','offside','held_ball'))::int AS turnovers,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('warning','suspension_2min','disqualification','card'))::int AS cards,
  CASE WHEN COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('miss','miss_7m')) + COUNT(*) FILTER (WHERE NOT e.is_void AND e.value > 0) = 0 THEN 0
       ELSE ROUND( (COUNT(*) FILTER (WHERE NOT e.is_void AND e.value > 0))::numeric
                   / NULLIF(COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('miss','miss_7m')) + COUNT(*) FILTER (WHERE NOT e.is_void AND e.value > 0), 0) * 100, 1)
  END AS shooting_pct
FROM public.match_events e
WHERE e.player_id IS NOT NULL
GROUP BY e.player_id;
GRANT SELECT ON public.vw_player_career TO anon, authenticated;

CREATE OR REPLACE VIEW public.vw_player_form AS
SELECT
  e.player_id AS athlete_id,
  e.fixture_id,
  f.scheduled_at,
  f.competition_id,
  COALESCE(SUM(e.value) FILTER (WHERE NOT e.is_void AND e.value > 0),0)::int AS goals,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type = 'assist')::int AS assists,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('intercept','steal'))::int AS intercepts,
  COUNT(*) FILTER (WHERE NOT e.is_void AND e.event_type IN ('warning','suspension_2min','disqualification','card'))::int AS cards
FROM public.match_events e
JOIN public.fixtures f ON f.id = e.fixture_id
WHERE e.player_id IS NOT NULL
GROUP BY e.player_id, e.fixture_id, f.scheduled_at, f.competition_id;
GRANT SELECT ON public.vw_player_form TO anon, authenticated;

CREATE OR REPLACE VIEW public.vw_player_records AS
SELECT
  athlete_id,
  MAX(goals) AS most_goals_in_match,
  SUM(goals)::int AS total_goals
FROM public.vw_player_form
GROUP BY athlete_id;
GRANT SELECT ON public.vw_player_records TO anon, authenticated;

-- Badges
CREATE TABLE IF NOT EXISTS public.player_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (athlete_id, code)
);
GRANT SELECT ON public.player_badges TO anon, authenticated;
GRANT ALL ON public.player_badges TO service_role;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read badges" ON public.player_badges FOR SELECT USING (true);

-- Auto-award trigger after each scoring event
CREATE OR REPLACE FUNCTION public.tg_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
BEGIN
  IF NEW.player_id IS NULL OR NEW.is_void OR NEW.value <= 0 THEN RETURN NEW; END IF;
  SELECT goals INTO v_total FROM public.vw_player_career WHERE athlete_id = NEW.player_id;
  IF v_total IS NULL THEN RETURN NEW; END IF;
  IF v_total >= 50 THEN
    INSERT INTO public.player_badges (athlete_id, code, label, context)
    VALUES (NEW.player_id, 'half_century', '50-Goal Club', jsonb_build_object('milestone', 50))
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_total >= 100 THEN
    INSERT INTO public.player_badges (athlete_id, code, label, context)
    VALUES (NEW.player_id, 'centurion', 'Centurion (100 Goals)', jsonb_build_object('milestone', 100))
    ON CONFLICT DO NOTHING;
  END IF;
  IF v_total >= 250 THEN
    INSERT INTO public.player_badges (athlete_id, code, label, context)
    VALUES (NEW.player_id, 'double_century', '250-Goal Maestro', jsonb_build_object('milestone', 250))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_badges ON public.match_events;
CREATE TRIGGER trg_award_badges AFTER INSERT ON public.match_events
FOR EACH ROW EXECUTE FUNCTION public.tg_award_badges();
