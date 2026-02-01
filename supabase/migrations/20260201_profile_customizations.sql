-- Profile customization tables for MySpace-inspired profile pages

CREATE TABLE profile_customizations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Avatar
  avatar_type TEXT DEFAULT 'default' CHECK (avatar_type IN ('default','upload','preset')),
  avatar_preset TEXT,
  avatar_badges TEXT[] DEFAULT '{}',
  -- Banner
  banner_type TEXT DEFAULT 'color' CHECK (banner_type IN ('color','upload')),
  banner_color TEXT DEFAULT '#6366f1',
  banner_image_path TEXT,
  -- Interests
  interests TEXT[] DEFAULT '{}',
  -- Theme
  theme_palette TEXT DEFAULT 'indigo' CHECK (theme_palette IN ('indigo','teal','orange','hotpink','neon','dark')),
  theme_font TEXT DEFAULT 'inter' CHECK (theme_font IN ('inter','space-grotesk','poppins','jetbrains-mono','caveat')),
  -- Background
  bg_type TEXT DEFAULT 'default' CHECK (bg_type IN ('default','color','upload')),
  bg_color TEXT,
  bg_image_path TEXT,
  bg_tile BOOLEAN DEFAULT false,
  bg_overlay TEXT DEFAULT 'none' CHECK (bg_overlay IN ('none','glitter','stars','bubbles')),
  -- Music
  music_url TEXT,
  music_autoplay BOOLEAN DEFAULT false,
  -- Widgets (JSONB array)
  widgets JSONB DEFAULT '[]'::jsonb,
  -- Guided CSS overrides (structured JSONB, not raw CSS)
  css_overrides JSONB DEFAULT '{}'::jsonb,
  -- Privacy
  visibility TEXT DEFAULT 'basic' CHECK (visibility IN ('full','basic','private')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profile_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN (
    'badge_slot','widget_slot','effect','premium_music','font','bg_overlay','premium_preset'
  )),
  unlock_key TEXT NOT NULL,
  alpha_cost INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, unlock_type, unlock_key)
);

-- Indexes
CREATE INDEX idx_profile_customizations_visibility ON profile_customizations(visibility);
CREATE INDEX idx_profile_unlocks_user ON profile_unlocks(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_profile_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_customization_updated
  BEFORE UPDATE ON profile_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_customization_timestamp();

-- RLS Policies
ALTER TABLE profile_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own customization
CREATE POLICY "Users can read own customization"
  ON profile_customizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customization"
  ON profile_customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customization"
  ON profile_customizations FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can read non-private customizations (for public profiles)
CREATE POLICY "Public can read non-private customizations"
  ON profile_customizations FOR SELECT
  USING (visibility != 'private');

-- Mentors can read mentee customizations
CREATE POLICY "Mentors can read mentee customizations"
  ON profile_customizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.mentor_id = auth.uid()
      AND mentorships.teen_id = profile_customizations.user_id
      AND mentorships.status = 'active'
    )
  );

-- Users can read/write their own unlocks
CREATE POLICY "Users can read own unlocks"
  ON profile_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocks"
  ON profile_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for profile assets (avatars, banners, backgrounds)
-- Note: Create 'profile-assets' bucket in Supabase dashboard as public bucket
-- Storage policies:
-- - Public read access for all files
-- - Authenticated users can upload to their own folder: {user_id}/*
