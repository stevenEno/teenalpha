-- Add per-mentor scheduling link. Used by the sprint Week 1 "Book mentor session"
-- action to open the mentor's Calendly in a new tab, bypassing in-app hour-balance
-- tracking which is reserved for the separately-purchased mentor-hours product.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calendly_url TEXT;

COMMENT ON COLUMN public.profiles.calendly_url IS
  'Mentor scheduling link (Calendly or Cal.com). Surfaced on sprint Week 1 + any inline "book a session" CTA.';
