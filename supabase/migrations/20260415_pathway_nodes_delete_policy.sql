-- Needed for the self-heal in apps/web/lib/pathway/seed.ts to recover from a
-- malformed graph (RLS was blocking the cleanup delete).
DROP POLICY IF EXISTS "pathway nodes own delete" ON public.pathway_nodes;
CREATE POLICY "pathway nodes own delete"
  ON public.pathway_nodes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
