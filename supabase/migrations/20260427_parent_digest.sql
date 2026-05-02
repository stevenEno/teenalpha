-- Adds opt-out for weekly parent digest emails.
ALTER TABLE public.family_connections
  ADD COLUMN IF NOT EXISTS digest_unsubscribed_at timestamptz;
