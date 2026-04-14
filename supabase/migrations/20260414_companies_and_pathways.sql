-- Phase 2: Companies + personalized pathway matches
-- Companies power the /map feature (geo pins + filter-by-interest).
-- Source enum tracks where a row came from (manual seed, southBay port, TBPN scraper).
-- Sectors/interest_categories are text[] — open vocabulary — because TBPN ingestion
-- will bring companies from every sector, not just the 5 aerospace/defense values.

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  website text,
  sector text NOT NULL,
  interest_categories text[] NOT NULL DEFAULT '{}',
  teen_roles text[] NOT NULL DEFAULT '{}',
  micro_experiment text,

  -- Geo
  address text,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  distance_from_center numeric,

  -- Funding / signals (TBPN-populated)
  funding_raised_usd bigint,
  funding_stage text,
  funding_date date,
  hiring_signal boolean NOT NULL DEFAULT false,

  -- Provenance
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'southbay', 'tbpn')),
  source_ref text,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_sector ON public.companies (sector);
CREATE INDEX IF NOT EXISTS idx_companies_source ON public.companies (source);
CREATE INDEX IF NOT EXISTS idx_companies_geo ON public.companies (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_companies_interest ON public.companies USING gin (interest_categories);

-- Personalized pathway result per teen (one active row per user; regenerate = new row)
CREATE TABLE IF NOT EXISTS public.pathway_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_answers jsonb NOT NULL,
  parent_voice jsonb NOT NULL,
  teen_voice jsonb NOT NULL,
  matched_company_ids uuid[] NOT NULL DEFAULT '{}',
  is_current boolean NOT NULL DEFAULT true,
  generated_by text NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'fallback')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathway_matches_user_current
  ON public.pathway_matches (user_id) WHERE is_current = true;

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_matches ENABLE ROW LEVEL SECURITY;

-- Companies: readable by any authenticated user. Gating (teen needs first project
-- completed) is enforced in the app layer / middleware so parents, mentors, and
-- admins can always see the map regardless of the viewing teen's progress.
DROP POLICY IF EXISTS "companies readable by authenticated" ON public.companies;
CREATE POLICY "companies readable by authenticated"
  ON public.companies FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can write companies (TBPN cron uses service role, bypasses RLS)
DROP POLICY IF EXISTS "companies admin write" ON public.companies;
CREATE POLICY "companies admin write"
  ON public.companies FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pathway matches: users read/write their own. Mentors of a teen read their teen's.
DROP POLICY IF EXISTS "pathway own read" ON public.pathway_matches;
CREATE POLICY "pathway own read"
  ON public.pathway_matches FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.mentor_id = auth.uid() AND m.teen_id = pathway_matches.user_id AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "pathway own write" ON public.pathway_matches;
CREATE POLICY "pathway own write"
  ON public.pathway_matches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pathway own update" ON public.pathway_matches;
CREATE POLICY "pathway own update"
  ON public.pathway_matches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
