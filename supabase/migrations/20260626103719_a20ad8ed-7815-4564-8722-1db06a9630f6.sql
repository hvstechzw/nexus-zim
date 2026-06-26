
-- =========================================================
-- PHASE 4 — COMMUNITY & ENGAGEMENT
-- =========================================================

-- ---------- FOLLOWS ----------
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('athlete','school_team','competition','school')),
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_user ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_entity ON public.follows(entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are publicly readable"
  ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users manage their own follows (insert)"
  ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage their own follows (delete)"
  ON public.follows FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- FEED ITEMS ----------
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('match_result','milestone','badge','mvp','announcement','highlight')),
  title text NOT NULL,
  body text,
  image_url text,
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_created ON public.feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_fixture ON public.feed_items(fixture_id);
CREATE INDEX IF NOT EXISTS idx_feed_competition ON public.feed_items(competition_id);
CREATE INDEX IF NOT EXISTS idx_feed_athlete ON public.feed_items(athlete_id);
CREATE INDEX IF NOT EXISTS idx_feed_team ON public.feed_items(school_team_id);

GRANT SELECT ON public.feed_items TO anon, authenticated;
GRANT ALL ON public.feed_items TO service_role;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feed is publicly readable"
  ON public.feed_items FOR SELECT USING (true);
CREATE POLICY "Admins can post feed items"
  ON public.feed_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins can update feed items"
  ON public.feed_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins can delete feed items"
  ON public.feed_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ---------- MOM VOTES ----------
CREATE TABLE IF NOT EXISTS public.mom_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_mom_fixture ON public.mom_votes(fixture_id);
CREATE INDEX IF NOT EXISTS idx_mom_athlete ON public.mom_votes(athlete_id);

GRANT SELECT, INSERT, DELETE ON public.mom_votes TO authenticated;
GRANT SELECT ON public.mom_votes TO anon;
GRANT ALL ON public.mom_votes TO service_role;
ALTER TABLE public.mom_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MoM votes are publicly readable"
  ON public.mom_votes FOR SELECT USING (true);
CREATE POLICY "Users cast their own MoM vote"
  ON public.mom_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users withdraw their own MoM vote"
  ON public.mom_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tally view
CREATE OR REPLACE VIEW public.vw_mom_tally
WITH (security_invoker = true) AS
SELECT
  v.fixture_id,
  v.athlete_id,
  COUNT(*)::int AS votes,
  ROW_NUMBER() OVER (PARTITION BY v.fixture_id ORDER BY COUNT(*) DESC) AS rank
FROM public.mom_votes v
GROUP BY v.fixture_id, v.athlete_id;

GRANT SELECT ON public.vw_mom_tally TO anon, authenticated;

-- ---------- SHARE CARDS ----------
CREATE TABLE IF NOT EXISTS public.share_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('match','player','team','milestone')),
  fixture_id uuid REFERENCES public.fixtures(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE,
  school_team_id uuid REFERENCES public.school_teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  image_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_share_slug ON public.share_cards(slug);

GRANT SELECT ON public.share_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.share_cards TO authenticated;
GRANT ALL ON public.share_cards TO service_role;
ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Share cards are publicly readable"
  ON public.share_cards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create share cards"
  ON public.share_cards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators or admins can update share cards"
  ON public.share_cards FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Creators or admins can delete share cards"
  ON public.share_cards FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ---------- TRIGGER: Auto-publish feed on completed fixtures ----------
CREATE OR REPLACE FUNCTION public.tg_fixture_publish_feed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_home text; v_away text; v_title text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT name INTO v_home FROM public.school_teams WHERE id = NEW.home_school_team_id;
    SELECT name INTO v_away FROM public.school_teams WHERE id = NEW.away_school_team_id;
    v_title := format('%s %s — %s %s',
      COALESCE(v_home,'Home'), COALESCE(NEW.home_score,0),
      COALESCE(NEW.away_score,0), COALESCE(v_away,'Away'));
    INSERT INTO public.feed_items (kind, title, body, fixture_id, competition_id, school_team_id, payload)
    VALUES ('match_result', v_title, 'Full-time result published.', NEW.id, NEW.competition_id,
            CASE WHEN COALESCE(NEW.home_score,0) >= COALESCE(NEW.away_score,0)
                 THEN NEW.home_school_team_id ELSE NEW.away_school_team_id END,
            jsonb_build_object('home_score',NEW.home_score,'away_score',NEW.away_score));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_fixture_publish_feed ON public.fixtures;
CREATE TRIGGER trg_fixture_publish_feed
AFTER UPDATE ON public.fixtures
FOR EACH ROW EXECUTE FUNCTION public.tg_fixture_publish_feed();

-- ---------- TRIGGER: Auto-publish feed when badges awarded ----------
CREATE OR REPLACE FUNCTION public.tg_badge_publish_feed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  SELECT COALESCE(NULLIF(display_name,''), first_name || ' ' || LEFT(last_name,1) || '.')
    INTO v_name FROM public.athletes WHERE id = NEW.athlete_id;
  INSERT INTO public.feed_items (kind, title, body, athlete_id, payload)
  VALUES ('badge', format('🏅 %s unlocked: %s', COALESCE(v_name,'Player'), NEW.label),
          'New career milestone reached.', NEW.athlete_id,
          jsonb_build_object('code', NEW.code));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_badge_publish_feed ON public.player_badges;
CREATE TRIGGER trg_badge_publish_feed
AFTER INSERT ON public.player_badges
FOR EACH ROW EXECUTE FUNCTION public.tg_badge_publish_feed();

-- Enable realtime for feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_items;
