-- First Dollar infrastructure: Payment Link generation + earning tracker.

-- Store the moneyPath goal and Stripe Payment Link on each project.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS money_path text,
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_id text;

-- Track when a teen earns their first dollar (platform-wide milestone).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_dollar_earned_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_dollar_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_dollar_evidence_url text,
  ADD COLUMN IF NOT EXISTS first_dollar_project_id uuid REFERENCES public.projects(id);
