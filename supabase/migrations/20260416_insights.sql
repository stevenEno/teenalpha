-- Phase 6 (lightweight): admin-curated insights from articles, podcasts, etc.
-- Captured via /admin/insights paste form. Future cron will sync from Obsidian
-- using the obsidian_path column as the upsert key.

CREATE TABLE IF NOT EXISTS public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text,
  source text,
  author text,
  takeaway text,
  body_md text,
  tags text[] NOT NULL DEFAULT '{}',
  audience text[] NOT NULL DEFAULT '{teens,mentors}',

  obsidian_path text UNIQUE,

  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  last_synced_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_insights_tags ON public.insights USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_insights_audience ON public.insights USING gin (audience);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insights admin read" ON public.insights;
CREATE POLICY "insights admin read"
  ON public.insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );

DROP POLICY IF EXISTS "insights admin write" ON public.insights;
CREATE POLICY "insights admin write"
  ON public.insights FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
