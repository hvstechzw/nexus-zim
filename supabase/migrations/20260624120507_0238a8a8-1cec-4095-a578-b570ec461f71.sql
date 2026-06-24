ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS external_student_id text;
ALTER TABLE public.athletes ADD CONSTRAINT athletes_external_student_id_key UNIQUE (external_student_id);
CREATE INDEX IF NOT EXISTS athletes_external_student_id_idx ON public.athletes(external_student_id);

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS external_school_id text;
ALTER TABLE public.teams ADD CONSTRAINT teams_external_school_id_key UNIQUE (external_school_id);
CREATE INDEX IF NOT EXISTS teams_external_school_id_idx ON public.teams(external_school_id);

-- Backfill athletes.external_student_id from auth.users.user_metadata.scholastic_id
UPDATE public.athletes a
SET external_student_id = (u.raw_user_meta_data->>'scholastic_id')
FROM auth.users u
WHERE a.user_id = u.id
  AND a.external_student_id IS NULL
  AND u.raw_user_meta_data ? 'scholastic_id'
  AND (u.raw_user_meta_data->>'scholastic_id') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.athletes a2
    WHERE a2.external_student_id = (u.raw_user_meta_data->>'scholastic_id')
      AND a2.id <> a.id
  );

-- Backfill teams.external_school_id from the school coordinator's auth user metadata
UPDATE public.teams t
SET external_school_id = (u.raw_user_meta_data->>'scholastic_id')
FROM auth.users u
WHERE t.manager_id = u.id
  AND t.external_school_id IS NULL
  AND u.raw_user_meta_data ? 'scholastic_id'
  AND (u.raw_user_meta_data->>'scholastic_id') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.teams t2
    WHERE t2.external_school_id = (u.raw_user_meta_data->>'scholastic_id')
      AND t2.id <> t.id
  );