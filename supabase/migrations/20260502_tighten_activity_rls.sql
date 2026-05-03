-- Tighten activity_events RLS: only teens and admins can read feed events directly.
-- Parents and mentors read their teen's activity via service role in /family/dashboard and /api/feed.

DROP POLICY IF EXISTS "activity events read" ON public.activity_events;

CREATE POLICY "activity events teen feed" ON public.activity_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teen')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
