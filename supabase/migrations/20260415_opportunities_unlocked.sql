-- Tracks whether the one-time retroactive opportunity injection has run for a teen
-- (triggered the first time they complete 5+ projects).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS opportunities_unlocked_at timestamptz;
