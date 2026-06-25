ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE public.competitions DROP CONSTRAINT IF EXISTS competitions_stage_check;
ALTER TABLE public.competitions ADD CONSTRAINT competitions_stage_check
  CHECK (stage IS NULL OR stage IN ('zonal','district','provincial','national'));
CREATE INDEX IF NOT EXISTS idx_competitions_stage ON public.competitions(stage);