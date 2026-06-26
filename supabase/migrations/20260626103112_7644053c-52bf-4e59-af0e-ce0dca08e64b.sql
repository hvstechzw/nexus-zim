
-- Phase 3: Tournament Hosting Wizard support

-- Allow standings and registrations to track school_teams directly
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS school_team_id uuid REFERENCES public.school_teams(id) ON DELETE CASCADE;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS group_label text;
CREATE INDEX IF NOT EXISTS idx_standings_school_team ON public.standings(school_team_id);
CREATE INDEX IF NOT EXISTS idx_standings_competition_group ON public.standings(competition_id, group_label);

ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS school_team_id uuid REFERENCES public.school_teams(id) ON DELETE CASCADE;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS group_label text;
CREATE INDEX IF NOT EXISTS idx_registrations_school_team ON public.registrations(school_team_id);

-- Bracket linkage on fixtures (winner advances into this slot)
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS group_label text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS bracket_slot text; -- 'home' | 'away'
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS advances_to_fixture_id uuid REFERENCES public.fixtures(id) ON DELETE SET NULL;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS bracket_round integer;
CREATE INDEX IF NOT EXISTS idx_fixtures_advances_to ON public.fixtures(advances_to_fixture_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_competition_group ON public.fixtures(competition_id, group_label);

-- Points config on competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS points_config jsonb DEFAULT '{"win":3,"draw":1,"loss":0}'::jsonb;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS group_size integer;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS group_count integer;

-- Recompute standings (school_team-aware) for one competition
CREATE OR REPLACE FUNCTION public.recompute_standings(_competition_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg jsonb;
  v_win int; v_draw int; v_loss int;
BEGIN
  SELECT COALESCE(points_config, '{"win":3,"draw":1,"loss":0}'::jsonb) INTO v_cfg
  FROM public.competitions WHERE id = _competition_id;
  v_win  := COALESCE((v_cfg->>'win')::int, 3);
  v_draw := COALESCE((v_cfg->>'draw')::int, 1);
  v_loss := COALESCE((v_cfg->>'loss')::int, 0);

  -- Wipe and recompute for school_team-based competitions
  DELETE FROM public.standings WHERE competition_id = _competition_id AND school_team_id IS NOT NULL;

  WITH played AS (
    SELECT f.* FROM public.fixtures f
    WHERE f.competition_id = _competition_id
      AND f.status = 'completed'
      AND f.home_school_team_id IS NOT NULL
      AND f.away_school_team_id IS NOT NULL
      AND (f.bracket_round IS NULL) -- group/league only
  ),
  sides AS (
    SELECT home_school_team_id AS team, away_school_team_id AS opp,
           COALESCE(home_score,0) AS sf, COALESCE(away_score,0) AS sa, group_label FROM played
    UNION ALL
    SELECT away_school_team_id, home_school_team_id,
           COALESCE(away_score,0), COALESCE(home_score,0), group_label FROM played
  ),
  agg AS (
    SELECT team, group_label,
      COUNT(*) AS played,
      COUNT(*) FILTER (WHERE sf > sa) AS won,
      COUNT(*) FILTER (WHERE sf = sa) AS drawn,
      COUNT(*) FILTER (WHERE sf < sa) AS lost,
      SUM(sf) AS score_for, SUM(sa) AS score_against
    FROM sides GROUP BY team, group_label
  )
  INSERT INTO public.standings
    (competition_id, school_team_id, group_label, played, won, drawn, lost,
     score_for, score_against, score_diff, points)
  SELECT _competition_id, team, group_label, played, won, drawn, lost,
         score_for, score_against, score_for - score_against,
         won * v_win + drawn * v_draw + lost * v_loss
  FROM agg;

  -- Position within group (or overall)
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY competition_id, COALESCE(group_label,'_')
      ORDER BY points DESC, score_diff DESC, score_for DESC
    ) AS pos
    FROM public.standings
    WHERE competition_id = _competition_id AND school_team_id IS NOT NULL
  )
  UPDATE public.standings s SET position = r.pos
  FROM ranked r WHERE s.id = r.id;
END;
$$;

-- Bracket advance: when a KO fixture completes, push winner into the next slot
CREATE OR REPLACE FUNCTION public.tg_fixture_bracket_advance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_school_team uuid;
BEGIN
  IF NEW.status = 'completed' AND NEW.advances_to_fixture_id IS NOT NULL
     AND COALESCE(NEW.home_score,0) <> COALESCE(NEW.away_score,0) THEN
    v_winner_school_team := CASE WHEN NEW.home_score > NEW.away_score
                                 THEN NEW.home_school_team_id ELSE NEW.away_school_team_id END;
    IF v_winner_school_team IS NOT NULL THEN
      IF NEW.bracket_slot = 'away' THEN
        UPDATE public.fixtures SET away_school_team_id = v_winner_school_team, updated_at = now()
        WHERE id = NEW.advances_to_fixture_id AND away_school_team_id IS NULL;
      ELSE
        UPDATE public.fixtures SET home_school_team_id = v_winner_school_team, updated_at = now()
        WHERE id = NEW.advances_to_fixture_id AND home_school_team_id IS NULL;
      END IF;
    END IF;
  END IF;

  -- Recompute standings for group-stage results
  IF NEW.status = 'completed' AND NEW.bracket_round IS NULL THEN
    PERFORM public.recompute_standings(NEW.competition_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fixture_bracket_advance ON public.fixtures;
CREATE TRIGGER trg_fixture_bracket_advance
AFTER UPDATE OF status, home_score, away_score ON public.fixtures
FOR EACH ROW EXECUTE FUNCTION public.tg_fixture_bracket_advance();
