-- Tighten pathway_nodes RLS: remove INSERT and UPDATE policies for authenticated users.
-- All writes go through service role via API routes (/api/pathway/complete, /api/pathway/start-project).
-- Keep SELECT (own + mentor + admin) and DELETE (own) for authenticated.

DROP POLICY IF EXISTS "pathway nodes own insert" ON public.pathway_nodes;
DROP POLICY IF EXISTS "pathway nodes own update" ON public.pathway_nodes;
