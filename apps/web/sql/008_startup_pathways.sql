-- Startup Pathways table for TBPN podcast-based career pathways
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS startup_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_interests JSONB NOT NULL,        -- Snapshot of interests used for generation
  tbpn_episodes JSONB NOT NULL,            -- Episodes analyzed (hidden from non-admins)
  pathways JSONB NOT NULL,                 -- The 3 generated pathways
  chosen_pathway_index INTEGER,            -- Which pathway the student chose (0, 1, or 2)
  chosen_at TIMESTAMPTZ,                   -- When they chose the pathway
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- The project created from chosen pathway
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_startup_pathways_profile_id ON startup_pathways(profile_id);

-- Create index for ordering by date
CREATE INDEX IF NOT EXISTS idx_startup_pathways_created_at ON startup_pathways(created_at DESC);

-- Enable RLS
ALTER TABLE startup_pathways ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own pathways
CREATE POLICY "Users can read own startup_pathways"
  ON startup_pathways
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Users can insert their own pathways
CREATE POLICY "Users can insert own startup_pathways"
  ON startup_pathways
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own pathways
CREATE POLICY "Users can update own startup_pathways"
  ON startup_pathways
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Policy: Users can delete their own pathways
CREATE POLICY "Users can delete own startup_pathways"
  ON startup_pathways
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_startup_pathways_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_startup_pathways_updated_at
  BEFORE UPDATE ON startup_pathways
  FOR EACH ROW
  EXECUTE FUNCTION update_startup_pathways_updated_at();
