-- Activity feed: social creation loop for teens.
-- Events inserted by server on qualifying actions. Pull-based feed query.
-- feed_visible on profiles controls whether a teen appears in the feed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feed_visible boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_role text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'pathway_complete', 'evidence_submitted', 'project_complete', 'streak_milestone'
  )),
  title text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_feed
  ON public.activity_events (created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read feed events.
DROP POLICY IF EXISTS "activity events read" ON public.activity_events;
CREATE POLICY "activity events read"
  ON public.activity_events FOR SELECT
  TO authenticated
  USING (true);

-- Only service role inserts events (from API routes).
-- No INSERT policy for authenticated — keeps the feed tamper-proof.
