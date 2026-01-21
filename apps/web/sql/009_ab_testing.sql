-- A/B Testing Analytics Schema
-- Tracks landing page variant views and conversions

-- Landing page events table
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,              -- Anonymous visitor identifier (from cookie)
  variant TEXT NOT NULL,                  -- Landing page variant: screen-time, grow, leapfrog, purpose
  event_type TEXT NOT NULL,               -- view, signup_started, signup_completed, onboarding_completed
  user_id UUID REFERENCES profiles(id),   -- Linked after signup
  metadata JSONB DEFAULT '{}',            -- Additional event data
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ab_test_events_variant ON ab_test_events(variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type ON ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_created_at ON ab_test_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_visitor_id ON ab_test_events(visitor_id);

-- View for aggregated stats (makes dashboard queries faster)
-- Using SECURITY INVOKER so it respects the querying user's RLS policies
CREATE OR REPLACE VIEW ab_test_stats
WITH (security_invoker = true) AS
SELECT
  variant,
  event_type,
  DATE(created_at) as date,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM ab_test_events
GROUP BY variant, event_type, DATE(created_at);

-- Function to get conversion funnel for a date range
-- Using SECURITY INVOKER so it respects the querying user's RLS policies
CREATE OR REPLACE FUNCTION get_ab_test_funnel(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  variant TEXT,
  views BIGINT,
  signups_started BIGINT,
  signups_completed BIGINT,
  onboarding_completed BIGINT,
  view_to_signup_rate NUMERIC,
  signup_to_complete_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.variant,
    COUNT(*) FILTER (WHERE e.event_type = 'view') as views,
    COUNT(*) FILTER (WHERE e.event_type = 'signup_started') as signups_started,
    COUNT(*) FILTER (WHERE e.event_type = 'signup_completed') as signups_completed,
    COUNT(*) FILTER (WHERE e.event_type = 'onboarding_completed') as onboarding_completed,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'signup_completed')::NUMERIC /
        COUNT(*) FILTER (WHERE e.event_type = 'view')::NUMERIC * 100,
        2
      )
      ELSE 0
    END as view_to_signup_rate,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'signup_started') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'signup_completed')::NUMERIC /
        COUNT(*) FILTER (WHERE e.event_type = 'signup_started')::NUMERIC * 100,
        2
      )
      ELSE 0
    END as signup_to_complete_rate
  FROM ab_test_events e
  WHERE e.created_at BETWEEN start_date AND end_date
  GROUP BY e.variant
  ORDER BY views DESC;
END;
$$;

-- RLS Policies (allow insert from anyone, read only for admins)
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert ab_test_events"
  ON ab_test_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can read ab_test_events"
  ON ab_test_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
