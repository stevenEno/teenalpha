-- Summer 2026 cohort application intake from /parent page.
-- Simple form capture; Steven reviews manually.

CREATE TABLE IF NOT EXISTS public.cohort_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  teen_name text NOT NULL,
  teen_curiosity text,
  teen_self_starter text,
  cohort text NOT NULL DEFAULT 'summer-2026',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'accepted', 'declined', 'enrolled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cohort_applications ENABLE ROW LEVEL SECURITY;

-- Only admin reads applications. Service role inserts (no auth required to apply).
DROP POLICY IF EXISTS "cohort apps admin read" ON public.cohort_applications;
CREATE POLICY "cohort apps admin read"
  ON public.cohort_applications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
