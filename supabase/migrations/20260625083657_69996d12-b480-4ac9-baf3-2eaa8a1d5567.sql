
-- 1. school_staff mirror (populated by scholastic-sync action 'sync-staff')
CREATE TABLE IF NOT EXISTS public.school_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ss_staff_id text NOT NULL UNIQUE,
  ss_school_id text NOT NULL,
  email text,
  phone text,
  name text NOT NULL,
  title text,
  department text,
  primary_role text,
  roles text[] NOT NULL DEFAULT ARRAY[]::text[],
  sport_relevant boolean NOT NULL DEFAULT false,
  sports text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS school_staff_email_idx ON public.school_staff (lower(email));
CREATE INDEX IF NOT EXISTS school_staff_school_idx ON public.school_staff (ss_school_id);

GRANT SELECT ON public.school_staff TO authenticated;
GRANT ALL ON public.school_staff TO service_role;
ALTER TABLE public.school_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sport-relevant staff"
  ON public.school_staff FOR SELECT TO authenticated
  USING (sport_relevant = true);

CREATE POLICY "Admins manage staff"
  ON public.school_staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER school_staff_updated_at
  BEFORE UPDATE ON public.school_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. school_teams gets team photo + coach (referencing SS staff mirror)
ALTER TABLE public.school_teams
  ADD COLUMN IF NOT EXISTS team_photo_url text,
  ADD COLUMN IF NOT EXISTS coach_ss_staff_id text,
  ADD COLUMN IF NOT EXISTS coach_name text;

-- 3. extend card verification log for anti-replay & richer audit
ALTER TABLE public.scholastic_card_verifications
  ADD COLUMN IF NOT EXISTS jti text,
  ADD COLUMN IF NOT EXISTS nonce text,
  ADD COLUMN IF NOT EXISTS fixture_id uuid,
  ADD COLUMN IF NOT EXISTS student_payload jsonb;

CREATE INDEX IF NOT EXISTS scv_jti_idx ON public.scholastic_card_verifications (jti);
CREATE INDEX IF NOT EXISTS scv_fixture_idx ON public.scholastic_card_verifications (fixture_id);
