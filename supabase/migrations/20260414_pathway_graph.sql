-- Phase 4a: dynamic pathway graph per teen.
-- Replaces the scrapped quiz-based pathway_matches table.
-- Each teen has a forest of 5 root nodes (seeded from their /explore paths).
-- Roots → skill nodes → (later) project nodes → (later) opportunity nodes tied
-- to companies on the map. Opportunity nodes are gated behind 5 completed projects.

DROP TABLE IF EXISTS public.pathway_matches CASCADE;

CREATE TABLE IF NOT EXISTS public.pathway_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_node_id uuid REFERENCES public.pathway_nodes(id) ON DELETE CASCADE,

  kind text NOT NULL CHECK (kind IN ('root', 'skill', 'project', 'opportunity')),
  status text NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'available', 'active', 'completed')),

  title text NOT NULL,
  description text,
  icon text,

  -- Which of the teen's 5 original explore paths this node descends from.
  -- Shared across an entire subtree; lets us render the graph colored by path.
  source_path_id text,
  source_path_name text,

  -- When a 'project' node is activated, it spawns a real projects row.
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Opportunity nodes link to companies on the map.
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,

  depth int NOT NULL DEFAULT 0,
  order_index int NOT NULL DEFAULT 0,

  unlocked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathway_nodes_user ON public.pathway_nodes (user_id);
CREATE INDEX IF NOT EXISTS idx_pathway_nodes_parent ON public.pathway_nodes (parent_node_id);
CREATE INDEX IF NOT EXISTS idx_pathway_nodes_user_kind ON public.pathway_nodes (user_id, kind);

ALTER TABLE public.pathway_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pathway nodes own read" ON public.pathway_nodes;
CREATE POLICY "pathway nodes own read"
  ON public.pathway_nodes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.mentor_id = auth.uid() AND m.teen_id = pathway_nodes.user_id AND m.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "pathway nodes own insert" ON public.pathway_nodes;
CREATE POLICY "pathway nodes own insert"
  ON public.pathway_nodes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pathway nodes own update" ON public.pathway_nodes;
CREATE POLICY "pathway nodes own update"
  ON public.pathway_nodes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
