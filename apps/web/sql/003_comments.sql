-- Migration: Add comments table for mentor feedback
-- Run this in your Supabase SQL Editor

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT comments_must_have_target CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)
);

-- 2. Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view comments on their projects" ON public.comments;
DROP POLICY IF EXISTS "Mentors can view comments on mentee projects" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Authors can update their comments" ON public.comments;
DROP POLICY IF EXISTS "Authors can delete their comments" ON public.comments;

-- 4. Create RLS policies for comments

-- Anyone involved can view comments (project owner, task owner, mentor, comment author)
CREATE POLICY "Users can view comments on their projects"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    -- Author can see their own comments
    auth.uid() = author_id
    OR
    -- Project owner can see comments on their project
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.teen_id = auth.uid()
    )
    OR
    -- Mentor can see comments on their mentee's projects
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.mentorships m ON m.teen_id = p.teen_id
      WHERE p.id = project_id AND m.mentor_id = auth.uid() AND m.status = 'active'
    )
    OR
    -- Task-level comments: project owner
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      WHERE t.id = task_id AND p.teen_id = auth.uid()
    )
    OR
    -- Task-level comments: mentor
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      JOIN public.mentorships m ON m.teen_id = p.teen_id
      WHERE t.id = task_id AND m.mentor_id = auth.uid() AND m.status = 'active'
    )
  );

-- Mentors can create comments on their mentee's projects
-- Teens can create comments on their own projects (for notes/questions)
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (
      -- Teen commenting on their own project
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.teen_id = auth.uid()
      )
      OR
      -- Mentor commenting on mentee's project
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.mentorships m ON m.teen_id = p.teen_id
        WHERE p.id = project_id AND m.mentor_id = auth.uid() AND m.status = 'active'
      )
      OR
      -- Teen commenting on their own task
      EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        WHERE t.id = task_id AND p.teen_id = auth.uid()
      )
      OR
      -- Mentor commenting on mentee's task
      EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        JOIN public.mentorships m ON m.teen_id = p.teen_id
        WHERE t.id = task_id AND m.mentor_id = auth.uid() AND m.status = 'active'
      )
    )
  );

-- Authors can update their own comments
CREATE POLICY "Authors can update their comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own comments
CREATE POLICY "Authors can delete their comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

-- Verification query
-- SELECT * FROM public.comments ORDER BY created_at DESC LIMIT 10;
