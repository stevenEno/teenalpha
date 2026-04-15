-- Tracks the last processed item for each cron job so incremental ingestion
-- can resume without re-processing everything on each tick.
CREATE TABLE IF NOT EXISTS public.cron_state (
  job text PRIMARY KEY,
  last_ref text,
  last_run_at timestamptz,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Only service role writes to cron_state. No RLS needed for SELECT since
-- nothing client-side reads it.
ALTER TABLE public.cron_state ENABLE ROW LEVEL SECURITY;
