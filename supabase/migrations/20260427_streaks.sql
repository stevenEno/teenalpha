-- Streak system: tracks consecutive days of qualifying actions per teen.
-- One row per user, upserted lazily on each qualifying action.
-- No cron needed — streak evaluated on action + on read.

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Teens read their own streak. Parents/mentors read their teen's. Admin reads all.
DROP POLICY IF EXISTS "streaks read" ON public.streaks;
CREATE POLICY "streaks read"
  ON public.streaks FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.mentor_id = auth.uid() AND m.teen_id = streaks.user_id AND m.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.family_connections fc
      WHERE fc.parent_id = auth.uid() AND fc.teen_id = streaks.user_id AND fc.verified = true
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can upsert their own streak row.
DROP POLICY IF EXISTS "streaks own write" ON public.streaks;
CREATE POLICY "streaks own write"
  ON public.streaks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
