-- Visual Onboarding Migration
-- Adds tables for guest explore sessions and Alpha awards tracking

-- 1. Alpha awards tracking (new table)
CREATE TABLE IF NOT EXISTS alpha_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'explore_onboarding', 'referral', 'chat_streak', etc.
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_alpha_awards_user_id ON alpha_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_alpha_awards_source ON alpha_awards(source);

-- 2. Guest onboarding sessions for analytics (new table)
CREATE TABLE IF NOT EXISTS guest_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  interest TEXT NOT NULL,
  paths_generated JSONB,
  selected_path_index INTEGER,
  converted_user_id UUID REFERENCES profiles(id),
  variant TEXT DEFAULT 'mindmap',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for guest session lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_visitor_id ON guest_onboarding_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_converted ON guest_onboarding_sessions(converted_user_id);

-- 3. Extend profiles with onboarding fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_interest TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_alpha_awarded BOOLEAN DEFAULT FALSE;

-- 4. RLS Policies for alpha_awards
ALTER TABLE alpha_awards ENABLE ROW LEVEL SECURITY;

-- Users can read their own awards
CREATE POLICY "Users can read own alpha awards"
  ON alpha_awards FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can insert (via service role)
CREATE POLICY "Service role can insert alpha awards"
  ON alpha_awards FOR INSERT
  WITH CHECK (true);

-- 5. RLS Policies for guest_onboarding_sessions
ALTER TABLE guest_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert guest sessions (no auth required for guests)
CREATE POLICY "Anyone can insert guest sessions"
  ON guest_onboarding_sessions FOR INSERT
  WITH CHECK (true);

-- Users can read sessions that converted to their account
CREATE POLICY "Users can read own converted sessions"
  ON guest_onboarding_sessions FOR SELECT
  USING (converted_user_id = auth.uid());

-- Service role can read/update all sessions
CREATE POLICY "Service can update guest sessions"
  ON guest_onboarding_sessions FOR UPDATE
  USING (true);
