
-- 1. View: top players per competition (for "Best of Tournament" leaderboards)
CREATE OR REPLACE VIEW public.vw_competition_top_players AS
WITH ev AS (
  SELECT f.competition_id, e.player_id, e.value, e.event_type
  FROM public.match_events e
  JOIN public.fixtures f ON f.id = e.fixture_id
  WHERE e.player_id IS NOT NULL AND NOT e.is_void AND f.competition_id IS NOT NULL
)
SELECT
  competition_id,
  player_id AS athlete_id,
  COALESCE(SUM(CASE WHEN value > 0 THEN value ELSE 0 END), 0)::int AS points,
  COUNT(*) FILTER (WHERE event_type IN ('goal','goal_7m','super_shot'))::int AS goals,
  COUNT(*) FILTER (WHERE event_type = 'assist')::int AS assists,
  COUNT(*) FILTER (WHERE event_type IN ('intercept','steal','save'))::int AS defensive_actions,
  COUNT(DISTINCT (SELECT id FROM public.fixtures WHERE id IN (
    SELECT fixture_id FROM public.match_events m
    WHERE m.player_id = ev.player_id AND m.fixture_id = (SELECT fixture_id FROM public.match_events x WHERE x.id = ev.player_id LIMIT 1)
  )))::int AS _ignored,
  COALESCE(SUM(
    CASE WHEN value > 0 THEN value
         WHEN event_type='assist' THEN 0.5
         WHEN event_type IN ('intercept','steal','save') THEN 0.3
         WHEN event_type IN ('miss','miss_7m','technical_fault','turnover') THEN -0.1
         WHEN event_type IN ('warning','suspension_2min','disqualification') THEN -0.5
         ELSE 0 END
  ), 0)::numeric AS impact_score
FROM ev
GROUP BY competition_id, player_id;

GRANT SELECT ON public.vw_competition_top_players TO anon, authenticated, service_role;

-- 2. Trigger: on fixture completion, publish Player of the Match + award badge
CREATE OR REPLACE FUNCTION public.tg_fixture_publish_mom()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mvp uuid;
  v_name text;
  v_home text;
  v_away text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT mvp_player_id INTO v_mvp FROM public.match_state WHERE fixture_id = NEW.id;
    IF v_mvp IS NOT NULL THEN
      SELECT COALESCE(NULLIF(display_name,''), first_name || ' ' || LEFT(last_name,1) || '.')
        INTO v_name FROM public.athletes WHERE id = v_mvp;
      SELECT name INTO v_home FROM public.school_teams WHERE id = NEW.home_school_team_id;
      SELECT name INTO v_away FROM public.school_teams WHERE id = NEW.away_school_team_id;

      INSERT INTO public.feed_items (kind, title, body, fixture_id, competition_id, athlete_id, payload)
      VALUES (
        'mvp',
        format('Player of the Match: %s', COALESCE(v_name,'TBD')),
        format('%s vs %s', COALESCE(v_home,'Home'), COALESCE(v_away,'Away')),
        NEW.id, NEW.competition_id, v_mvp,
        jsonb_build_object('fixture_id', NEW.id, 'home_score', NEW.home_score, 'away_score', NEW.away_score)
      );

      INSERT INTO public.player_badges (athlete_id, code, label, context)
      VALUES (v_mvp, 'player_of_the_match', 'Player of the Match',
              jsonb_build_object('fixture_id', NEW.id, 'competition_id', NEW.competition_id))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fixture_publish_mom ON public.fixtures;
CREATE TRIGGER trg_fixture_publish_mom
AFTER UPDATE OF status ON public.fixtures
FOR EACH ROW EXECUTE FUNCTION public.tg_fixture_publish_mom();
