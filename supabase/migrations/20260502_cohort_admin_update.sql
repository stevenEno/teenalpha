DROP POLICY IF EXISTS "cohort apps admin update" ON public.cohort_applications;
CREATE POLICY "cohort apps admin update" ON public.cohort_applications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
