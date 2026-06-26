-- Support syncing sport squads/rosters from Scholastic Services into
-- school_teams + school_team_players. Adds an external key so the sync can
-- upsert teams idempotently, and a uniqueness guard so a player can't be added
-- to the same team twice.
--
-- NULLs are distinct in a Postgres unique index, so existing manually-created
-- teams (external_ss_team_id IS NULL) are unaffected.

ALTER TABLE public.school_teams
  ADD COLUMN IF NOT EXISTS external_ss_team_id text;

CREATE UNIQUE INDEX IF NOT EXISTS school_teams_external_ss_team_id_key
  ON public.school_teams (external_ss_team_id);

CREATE UNIQUE INDEX IF NOT EXISTS school_team_players_team_athlete_key
  ON public.school_team_players (school_team_id, athlete_id);
