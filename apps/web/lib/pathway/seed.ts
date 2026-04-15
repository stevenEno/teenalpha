import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { ExplorePath } from '@teen-alpha/database';

export interface SeededNode {
  id: string;
  parent_node_id: string | null;
  kind: 'root' | 'skill' | 'project' | 'opportunity';
  status: 'locked' | 'available' | 'active' | 'completed';
  title: string;
  description: string | null;
  icon: string | null;
  source_path_id: string | null;
  source_path_name: string | null;
  project_id: string | null;
  company_id: string | null;
  depth: number;
  order_index: number;
}

/**
 * Seeds a teen's pathway graph from their most recent /explore session.
 * Returns null if the teen has no explore data — caller should redirect to /explore.
 * Idempotent: returns existing nodes if any already exist for this user.
 */
export async function seedPathwayGraph(
  supabase: SupabaseClient,
  userId: string
): Promise<SeededNode[] | null> {
  const { data: existing } = await supabase
    .from('pathway_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('depth', { ascending: true })
    .order('order_index', { ascending: true });

  if (existing && existing.length > 0) {
    // Self-heal: if roots exist with zero children, the pre-fix seed produced
    // an empty tree. Wipe and re-seed from the guest session.
    const hasChildren = existing.some((n) => n.depth > 0);
    if (hasChildren) return existing as SeededNode[];
    await supabase.from('pathway_nodes').delete().eq('user_id', userId);
  }

  // guest_onboarding_sessions is RLS-locked to service role (see sync-guest).
  // Use a service-role client for the lookup only.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First try: guest session already linked to this user via sync-guest
  let { data: session } = await admin
    .from('guest_onboarding_sessions')
    .select('paths_generated, selected_path_index, interest, visitor_id')
    .eq('converted_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback for teens whose sessions pre-date the visitorId fix: match by
  // profile.onboarding_interest and backfill converted_user_id.
  if (!session?.paths_generated) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_interest')
      .eq('id', userId)
      .single();
    if (profile?.onboarding_interest) {
      const { data: byInterest } = await admin
        .from('guest_onboarding_sessions')
        .select('id, paths_generated, selected_path_index, interest, visitor_id')
        .eq('interest', profile.onboarding_interest)
        .not('paths_generated', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byInterest?.paths_generated) {
        session = byInterest;
        await admin
          .from('guest_onboarding_sessions')
          .update({ converted_user_id: userId })
          .eq('id', byInterest.id);
      }
    }
  }

  const paths = (session?.paths_generated ?? []) as ExplorePath[];
  if (!paths || paths.length === 0) return null;

  const { data: selectedProject } = await supabase
    .from('projects')
    .select('id')
    .eq('teen_id', userId)
    .eq('category', 'explore')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const selectedIndex = session?.selected_path_index ?? null;

  const now = new Date().toISOString();
  const rootsToInsert = paths.map((p, i) => ({
    user_id: userId,
    parent_node_id: null,
    kind: 'root' as const,
    status: i === selectedIndex ? 'active' : 'available',
    title: p.name,
    description: p.tagline,
    icon: p.icon,
    source_path_id: p.id,
    source_path_name: p.name,
    project_id: i === selectedIndex ? selectedProject?.id ?? null : null,
    company_id: null,
    depth: 0,
    order_index: i,
    unlocked_at: now,
  }));

  const { data: insertedRoots, error: rootsError } = await supabase
    .from('pathway_nodes')
    .insert(rootsToInsert)
    .select();

  if (rootsError || !insertedRoots) {
    console.error('Failed to insert pathway roots:', rootsError);
    return null;
  }

  // Each root fans out to 5 branches. /explore only guarantees path summaries
  // (steps load lazily), so fall back through steps → skills → a generic
  // starter set to ensure every root has 5 children and zero dead ends.
  const skillsToInsert: Array<Record<string, unknown>> = [];
  for (let i = 0; i < insertedRoots.length; i++) {
    const root = insertedRoots[i];
    const path = paths[i] as ExplorePath & { skills?: string[] };

    type ChildSeed = { title: string; description: string | null };
    let children: ChildSeed[] = [];

    if (Array.isArray(path.steps) && path.steps.length > 0) {
      children = path.steps.slice(0, 5).map((s) => ({
        title: s.title,
        description: s.description,
      }));
    } else if (Array.isArray(path.skills) && path.skills.length > 0) {
      children = path.skills.slice(0, 5).map((s) => ({
        title: s,
        description: null,
      }));
    }

    // Pad to 5 with generic starter skills so there are no dead-end roots.
    const starters = [
      { title: 'Find 3 people already doing this', description: 'Message them one genuine question. Any reply counts.' },
      { title: 'Spend 30 minutes going deep', description: 'Pick the one tool, skill, or sub-topic that feels most alive.' },
      { title: 'Make something tiny', description: 'Ship the smallest possible artifact — a post, a sketch, a demo.' },
      { title: 'Learn one foundational skill', description: 'Identify the single skill that unlocks the rest. Spend a week on it.' },
      { title: 'Share what you made', description: 'Post it anywhere a real person will see it. Take the feedback.' },
    ];
    while (children.length < 5) children.push(starters[children.length]);

    children.forEach((c, sIdx) => {
      skillsToInsert.push({
        user_id: userId,
        parent_node_id: root.id,
        kind: 'skill',
        status: sIdx === 0 ? 'available' : 'locked',
        title: c.title,
        description: c.description,
        icon: null,
        source_path_id: path.id,
        source_path_name: path.name,
        depth: 1,
        order_index: sIdx,
        unlocked_at: sIdx === 0 ? now : null,
      });
    });
  }

  if (skillsToInsert.length > 0) {
    const { error: skillsError } = await supabase
      .from('pathway_nodes')
      .insert(skillsToInsert);
    if (skillsError) console.error('Failed to insert skill nodes:', skillsError);
  }

  const { data: all } = await supabase
    .from('pathway_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('depth', { ascending: true })
    .order('order_index', { ascending: true });

  return (all ?? []) as SeededNode[];
}
