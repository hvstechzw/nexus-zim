
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
  v_diff integer;
  v_win_home numeric;
  v_mvp uuid;
BEGIN
  SELECT
    COALESCE(SUM(value) FILTER (WHERE team_side='home' AND NOT is_void AND value > 0),0)::int,
    COALESCE(SUM(value) FILTER (WHERE team_side='away' AND NOT is_void AND value > 0),0)::int
  INTO v_home, v_away
  FROM public.match_events
  WHERE fixture_id = _fixture_id;

  SELECT id, period, clock_seconds INTO v_last, v_period, v_clock
  FROM public.match_events WHERE fixture_id = _fixture_id AND NOT is_void
  ORDER BY sequence DESC LIMIT 1;

  v_diff := v_home - v_away;
  v_win_home := GREATEST(0.02, LEAST(0.98, 0.5 + (v_diff::numeric * 0.05)));

  SELECT player_id INTO v_mvp FROM (
    SELECT player_id, SUM(CASE WHEN value > 0 THEN value
                               WHEN event_type='assist' THEN 0.5
                               WHEN event_type IN ('intercept','steal','save') THEN 0.3
                               WHEN event_type IN ('miss','miss_7m','technical_fault','turnover') THEN -0.1
                               WHEN event_type IN ('warning','suspension_2min','disqualification') THEN -0.5
                               ELSE 0 END) AS score
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

  IF TG_OP = 'INSERT' AND (NEW.value > 0 OR NEW.event_type IN ('warning','suspension_2min','disqualification','blue_card','card','injury','timeout')) THEN
    SELECT COALESCE(NULLIF(display_name,''), first_name || ' ' || LEFT(last_name,1) || '.') INTO v_player_name
    FROM public.athletes WHERE id = NEW.player_id;
    SELECT * INTO v_state FROM public.match_state WHERE fixture_id = v_fid;
    v_team := CASE WHEN NEW.team_side='home' THEN 'Home' ELSE 'Away' END;
    v_tone := CASE WHEN NEW.value > 0 THEN 'highlight'
                   WHEN NEW.event_type IN ('warning','suspension_2min','disqualification','blue_card','card') THEN 'critical'
                   ELSE 'info' END;
    v_text := CASE
      WHEN NEW.event_type='goal' THEN format('GOAL! %s — %s %s-%s, %s', COALESCE(v_player_name,'Team goal'), v_team, v_state.home_score, v_state.away_score, NEW.period)
      WHEN NEW.event_type='super_shot' THEN format('SUPER SHOT (+2)! %s — %s %s-%s', COALESCE(v_player_name,v_team), v_team, v_state.home_score, v_state.away_score)
      WHEN NEW.event_type='goal_7m' THEN format('7m GOAL! %s converts (%s).', COALESCE(v_player_name,v_team), v_team)
      WHEN NEW.event_type='warning' THEN format('YELLOW — %s (%s)', COALESCE(v_player_name,v_team), v_team)
      WHEN NEW.event_type='suspension_2min' THEN format('2-min suspension — %s (%s)', COALESCE(v_player_name,v_team), v_team)
      WHEN NEW.event_type='disqualification' THEN format('RED CARD — %s dismissed (%s)', COALESCE(v_player_name,v_team), v_team)
      WHEN NEW.event_type='timeout' THEN format('Team timeout — %s', v_team)
      WHEN NEW.event_type='injury' THEN 'Injury stoppage.'
      ELSE format('%s — %s', NEW.event_type, v_team)
    END;
    INSERT INTO public.match_commentary (fixture_id, event_id, text, tone, auto_generated)
    VALUES (v_fid, NEW.id, v_text, v_tone, true);
  END IF;
  RETURN NEW;
END;
$$;
