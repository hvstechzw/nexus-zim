
-- 1. Table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline TEXT NOT NULL CHECK (discipline IN ('Handball','Netball')),
  level TEXT NOT NULL CHECK (level IN ('zonal','district','provincial','national')),
  region TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  event_type TEXT NOT NULL DEFAULT 'competition' CHECK (event_type IN ('competition','camp','trial','congress','holiday','other')),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  season TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX calendar_events_discipline_idx ON public.calendar_events(discipline);
CREATE INDEX calendar_events_level_idx ON public.calendar_events(level);
CREATE INDEX calendar_events_start_idx ON public.calendar_events(start_date);
CREATE UNIQUE INDEX calendar_events_competition_unique ON public.calendar_events(competition_id) WHERE competition_id IS NOT NULL;

-- 2. Grants
GRANT SELECT ON public.calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;

-- 3. RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "calendar_events_select_all" ON public.calendar_events
  FOR SELECT USING (true);

CREATE POLICY "calendar_events_insert_admins" ON public.calendar_events
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'national_admin')
    OR public.has_role(auth.uid(), 'provincial_admin')
    OR public.has_role(auth.uid(), 'district_admin')
    OR public.has_role(auth.uid(), 'zonal_admin')
  );

CREATE POLICY "calendar_events_update_owner_or_super" ON public.calendar_events
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'national_admin')
  );

CREATE POLICY "calendar_events_delete_owner_or_super" ON public.calendar_events
  FOR DELETE TO authenticated USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'national_admin')
  );

-- 5. updated_at trigger
CREATE TRIGGER calendar_events_set_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Competition → calendar sync
CREATE OR REPLACE FUNCTION public.sync_competition_to_calendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discipline TEXT;
  v_level TEXT;
BEGIN
  -- Only mirror Handball/Netball competitions with a start date
  IF NEW.discipline NOT IN ('Handball','Netball') OR NEW.start_date IS NULL THEN
    DELETE FROM public.calendar_events WHERE competition_id = NEW.id;
    RETURN NEW;
  END IF;

  v_discipline := NEW.discipline;
  v_level := CASE
    WHEN NEW.level::text ILIKE '%national%' THEN 'national'
    WHEN NEW.level::text ILIKE '%provincial%' THEN 'provincial'
    WHEN NEW.level::text ILIKE '%district%' THEN 'district'
    WHEN NEW.level::text ILIKE '%zonal%' OR NEW.level::text ILIKE '%cluster%' THEN 'zonal'
    ELSE 'national'
  END;

  INSERT INTO public.calendar_events (
    discipline, level, region, title, description, start_date, end_date,
    event_type, competition_id, season, created_by
  ) VALUES (
    v_discipline, v_level, NEW.province, NEW.name, NEW.description,
    NEW.start_date, NEW.end_date, 'competition', NEW.id, NEW.season, NEW.created_by
  )
  ON CONFLICT (competition_id) DO UPDATE
    SET discipline = EXCLUDED.discipline,
        level = EXCLUDED.level,
        region = EXCLUDED.region,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        season = EXCLUDED.season,
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER competitions_sync_calendar
AFTER INSERT OR UPDATE OF name, description, start_date, end_date, discipline, level, province, season
ON public.competitions
FOR EACH ROW EXECUTE FUNCTION public.sync_competition_to_calendar();
