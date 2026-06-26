-- Fix: creating a Handball/Netball competition with a start_date failed with
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification".
--
-- The sync_competition_to_calendar() trigger (fires AFTER INSERT/UPDATE on
-- competitions) upserts calendar_events with `ON CONFLICT (competition_id)`.
-- The only matching index was PARTIAL:
--   CREATE UNIQUE INDEX ... (competition_id) WHERE competition_id IS NOT NULL
-- Postgres will not use a partial index as an ON CONFLICT arbiter unless the
-- statement repeats the same WHERE predicate, so the upsert threw and the whole
-- competition INSERT rolled back.
--
-- Replace the partial index with a plain unique index. NULLs are distinct in a
-- unique index, so non-competition calendar events (competition_id IS NULL) are
-- unaffected and can still be many.

-- Defensive: drop any duplicate competition rows so the unique index can build.
DELETE FROM public.calendar_events a
USING public.calendar_events b
WHERE a.competition_id IS NOT NULL
  AND a.competition_id = b.competition_id
  AND a.ctid < b.ctid;

DROP INDEX IF EXISTS public.calendar_events_competition_unique;

CREATE UNIQUE INDEX calendar_events_competition_unique
  ON public.calendar_events (competition_id);
