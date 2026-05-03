-- Allow mentors to update tasks on their mentees' projects
DROP POLICY IF EXISTS "mentor task update" ON public.tasks;
CREATE POLICY "mentor task update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.mentorships m ON m.teen_id = p.teen_id
      WHERE p.id = tasks.project_id
        AND m.mentor_id = auth.uid()
        AND m.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.mentorships m ON m.teen_id = p.teen_id
      WHERE p.id = tasks.project_id
        AND m.mentor_id = auth.uid()
        AND m.status = 'active'
    )
  );
