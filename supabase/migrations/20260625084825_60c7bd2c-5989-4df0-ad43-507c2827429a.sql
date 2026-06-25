-- 1. Add regional admin roles to the enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'zonal_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'zonal_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'district_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'district_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'provincial_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'provincial_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'national_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'national_admin';
  END IF;
END$$;

-- 2. Region assignments table
CREATE TABLE IF NOT EXISTS public.region_admin_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('zonal','district','provincial','national')),
  zone_name TEXT,
  district_name TEXT,
  province_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS region_admin_assignments_user_idx ON public.region_admin_assignments(user_id);
CREATE INDEX IF NOT EXISTS region_admin_assignments_level_idx ON public.region_admin_assignments(level, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.region_admin_assignments TO authenticated;
GRANT ALL ON public.region_admin_assignments TO service_role;
GRANT SELECT ON public.region_admin_assignments TO anon;

ALTER TABLE public.region_admin_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved regional admins"
  ON public.region_admin_assignments FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own assignments"
  ON public.region_admin_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage assignments"
  ON public.region_admin_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER region_admin_assignments_updated_at
  BEFORE UPDATE ON public.region_admin_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();