DROP POLICY IF EXISTS "Anyone submits coach registration" ON public.nexus_coaches;
CREATE POLICY "Public coach registration with safe defaults"
  ON public.nexus_coaches FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_verified = false
    AND (user_id IS NULL OR user_id = auth.uid())
  );