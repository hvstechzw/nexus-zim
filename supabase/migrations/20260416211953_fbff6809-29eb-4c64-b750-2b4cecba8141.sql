ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS age_group text,
  ADD COLUMN IF NOT EXISTS term text,
  ADD COLUMN IF NOT EXISTS is_sports_day boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_house_competition boolean DEFAULT false;

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS house text;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS sports_offered text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_competitions_age_group ON public.competitions(age_group);
CREATE INDEX IF NOT EXISTS idx_competitions_term ON public.competitions(term);
CREATE INDEX IF NOT EXISTS idx_athletes_house ON public.athletes(house);