-- Standings recalculation
--
-- Adds a SECURITY DEFINER function `recalc_standings(competition_id)` and a
-- trigger on `public.fixtures` that fires whenever a fixture transitions into
-- or out of `completed`. The function rebuilds the standings rows for the
-- competition from scratch based on completed fixtures only, using a simple
-- 3-1-0 points system.
--
-- Form is stored as the last 5 results (most recent first) as TEXT[] of
-- 'W' / 'D' / 'L' per team. Draws only apply to team fixtures; individual
-- athlete fixtures are skipped (those use a separate results model).

CREATE OR REPLACE FUNCTION public.recalc_standings(p_competition_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team RECORD;
  v_form TEXT[];
BEGIN
  -- Wipe existing rows for this competition and rebuild.
  DELETE FROM public.standings WHERE competition_id = p_competition_id;

  -- Aggregate per team across all completed fixtures.
  FOR v_team IN
    WITH completed AS (
      SELECT
        id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        ended_at,
        scheduled_at
      FROM public.fixtures
      WHERE competition_id = p_competition_id
        AND status = 'completed'
        AND home_team_id IS NOT NULL
        AND away_team_id IS NOT NULL
    ),
    sides AS (
      SELECT home_team_id AS team_id, home_score AS score_for, away_score AS score_against,
             CASE WHEN home_score > away_score THEN 'W'
                  WHEN home_score = away_score THEN 'D'
                  ELSE 'L' END AS result,
             COALESCE(ended_at, scheduled_at) AS at
      FROM completed
      UNION ALL
      SELECT away_team_id AS team_id, away_score AS score_for, home_score AS score_against,
             CASE WHEN away_score > home_score THEN 'W'
                  WHEN away_score = home_score THEN 'D'
                  ELSE 'L' END AS result,
             COALESCE(ended_at, scheduled_at) AS at
      FROM completed
    )
    SELECT
      team_id,
      COUNT(*)::INT AS played,
      COUNT(*) FILTER (WHERE result = 'W')::INT AS won,
      COUNT(*) FILTER (WHERE result = 'D')::INT AS drawn,
      COUNT(*) FILTER (WHERE result = 'L')::INT AS lost,
      COALESCE(SUM(score_for), 0)::NUMERIC AS score_for,
      COALESCE(SUM(score_against), 0)::NUMERIC AS score_against,
      (COUNT(*) FILTER (WHERE result = 'W') * 3
        + COUNT(*) FILTER (WHERE result = 'D') * 1)::NUMERIC AS points
    FROM sides
    GROUP BY team_id
  LOOP
    -- Last 5 results, most recent first.
    SELECT array_agg(result ORDER BY at DESC)
      INTO v_form
      FROM (
        SELECT result, at FROM (
          SELECT CASE WHEN home_score > away_score THEN 'W'
                      WHEN home_score = away_score THEN 'D'
                      ELSE 'L' END AS result,
                 COALESCE(ended_at, scheduled_at) AS at
          FROM public.fixtures
          WHERE competition_id = p_competition_id
            AND status = 'completed'
            AND home_team_id = v_team.team_id
          UNION ALL
          SELECT CASE WHEN away_score > home_score THEN 'W'
                      WHEN away_score = home_score THEN 'D'
                      ELSE 'L' END AS result,
                 COALESCE(ended_at, scheduled_at) AS at
          FROM public.fixtures
          WHERE competition_id = p_competition_id
            AND status = 'completed'
            AND away_team_id = v_team.team_id
        ) team_results
        ORDER BY at DESC
        LIMIT 5
      ) last_five;

    INSERT INTO public.standings (
      competition_id, team_id, played, won, drawn, lost,
      score_for, score_against, points, form, updated_at
    ) VALUES (
      p_competition_id, v_team.team_id, v_team.played, v_team.won, v_team.drawn, v_team.lost,
      v_team.score_for, v_team.score_against, v_team.points, v_form, now()
    );
  END LOOP;

  -- Assign positions ordered by points, then score diff, then score_for.
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY points DESC, score_diff DESC, score_for DESC
           ) AS rn
    FROM public.standings
    WHERE competition_id = p_competition_id
  )
  UPDATE public.standings s
  SET position = r.rn
  FROM ranked r
  WHERE s.id = r.id;
END;
$$;

COMMENT ON FUNCTION public.recalc_standings(UUID)
  IS 'Rebuild standings rows for a competition from completed fixtures (3-1-0 points, last-5 form).';

-- Trigger: fire whenever a fixture becomes/stops being completed, or when a
-- completed fixture's scores or team links change.
CREATE OR REPLACE FUNCTION public.trg_fixtures_recalc_standings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_competition UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_competition := OLD.competition_id;
  ELSE
    v_competition := NEW.competition_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      PERFORM public.recalc_standings(v_competition);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.status IS DISTINCT FROM NEW.status)
       OR (NEW.status = 'completed' AND (
             OLD.home_score IS DISTINCT FROM NEW.home_score
          OR OLD.away_score IS DISTINCT FROM NEW.away_score
          OR OLD.home_team_id IS DISTINCT FROM NEW.home_team_id
          OR OLD.away_team_id IS DISTINCT FROM NEW.away_team_id
       )) THEN
      PERFORM public.recalc_standings(v_competition);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      PERFORM public.recalc_standings(v_competition);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS fixtures_recalc_standings ON public.fixtures;
CREATE TRIGGER fixtures_recalc_standings
AFTER INSERT OR UPDATE OR DELETE ON public.fixtures
FOR EACH ROW EXECUTE FUNCTION public.trg_fixtures_recalc_standings();

-- Allow authenticated roles to call the recalc function directly as a fallback.
GRANT EXECUTE ON FUNCTION public.recalc_standings(UUID) TO authenticated;
