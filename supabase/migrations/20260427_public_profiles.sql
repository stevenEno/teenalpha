ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT true;
