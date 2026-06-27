-- Notifications engine: let users manage their own notifications, and generate
-- result notifications to followers + match officials when a fixture finishes.

-- 1) Users can mark their own notifications read (SELECT-own already exists).
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) SECURITY DEFINER helper to fan a notification out to many users. Bypasses
--    the admin-only INSERT policy so triggers/edge functions can create them.
CREATE OR REPLACE FUNCTION public.notify_users(
  _user_ids uuid[], _type text, _title text, _body text, _data jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, title, body, data, is_read)
  SELECT DISTINCT uid, _type, _title, _body, COALESCE(_data, '{}'::jsonb), false
  FROM unnest(_user_ids) AS uid
  WHERE uid IS NOT NULL;
$$;

-- 3) On fixture completion, notify everyone following the competition or either
--    team, plus the scorer and referee.
CREATE OR REPLACE FUNCTION public.trg_fixture_result_notify()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_home text;
  v_away text;
  v_title text;
  v_followers uuid[];
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed' THEN

    SELECT name INTO v_home FROM public.teams WHERE id = NEW.home_team_id;
    SELECT name INTO v_away FROM public.teams WHERE id = NEW.away_team_id;

    v_title := 'FT: ' || COALESCE(v_home, 'Home') || ' '
               || COALESCE(NEW.home_score, 0) || '–' || COALESCE(NEW.away_score, 0)
               || ' ' || COALESCE(v_away, 'Away');

    SELECT array_agg(DISTINCT user_id) INTO v_followers
    FROM public.follows
    WHERE (entity_type = 'competition' AND entity_id = NEW.competition_id::text)
       OR (entity_type = 'team' AND entity_id = NEW.home_team_id::text)
       OR (entity_type = 'team' AND entity_id = NEW.away_team_id::text);

    PERFORM public.notify_users(
      COALESCE(v_followers, ARRAY[]::uuid[]) || ARRAY[NEW.scorer_id, NEW.referee_id],
      'result',
      v_title,
      'The final result is in. Tap to view the match.',
      jsonb_build_object('fixture_id', NEW.id, 'competition_id', NEW.competition_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fixtures_result_notify ON public.fixtures;
CREATE TRIGGER fixtures_result_notify
  AFTER UPDATE ON public.fixtures
  FOR EACH ROW EXECUTE FUNCTION public.trg_fixture_result_notify();

GRANT EXECUTE ON FUNCTION public.notify_users(uuid[], text, text, text, jsonb) TO authenticated;
