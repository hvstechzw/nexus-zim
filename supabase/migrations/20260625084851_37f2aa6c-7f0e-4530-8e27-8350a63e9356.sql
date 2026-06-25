CREATE POLICY "Users can request their own regional role"
  ON public.region_admin_assignments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');