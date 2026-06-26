
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS preferred_position TEXT,
  ADD COLUMN IF NOT EXISTS secondary_position TEXT,
  ADD COLUMN IF NOT EXISTS dominant_hand TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS years_playing INTEGER,
  ADD COLUMN IF NOT EXISTS previous_clubs TEXT,
  ADD COLUMN IF NOT EXISTS parent_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_cleared BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS primary_sport TEXT;

CREATE TABLE IF NOT EXISTS public.external_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'scholastic',
  external_id TEXT,
  kind TEXT NOT NULL,
  external_student_id TEXT,
  external_school_id TEXT,
  competition_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  response JSONB,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_invitations TO authenticated;
GRANT ALL ON public.external_invitations TO service_role;

ALTER TABLE public.external_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage external invitations"
  ON public.external_invitations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_external_invitations_updated_at
  BEFORE UPDATE ON public.external_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
