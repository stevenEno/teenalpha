import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { expandNodeBranches } from '@/lib/pathway/expand';

const OPPORTUNITY_GATE_PROJECTS = 5;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { node_id } = await request.json();
  if (!node_id) return NextResponse.json({ error: 'missing node_id' }, { status: 400 });

  const { data: node, error: nodeErr } = await supabase
    .from('pathway_nodes')
    .select('*')
    .eq('id', node_id)
    .eq('user_id', user.id)
    .single();
  if (nodeErr || !node) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (node.status === 'completed') {
    return NextResponse.json({ error: 'already_completed' }, { status: 400 });
  }

  const now = new Date().toISOString();
  await supabase
    .from('pathway_nodes')
    .update({ status: 'completed', completed_at: now })
    .eq('id', node.id);

  // Unlock next locked sibling (keep at least one branch available)
  const { data: siblings } = await supabase
    .from('pathway_nodes')
    .select('*')
    .eq('user_id', user.id)
    .eq('parent_node_id', node.parent_node_id)
    .order('order_index');
  const nextLocked = siblings?.find((s) => s.status === 'locked');
  if (nextLocked) {
    await supabase
      .from('pathway_nodes')
      .update({ status: 'available', unlocked_at: now })
      .eq('id', nextLocked.id);
  }

  // Build ancestor chain for context
  const ancestry: string[] = [];
  let cursor = node;
  while (cursor) {
    ancestry.unshift(cursor.title);
    if (!cursor.parent_node_id) break;
    const { data: parent } = await supabase
      .from('pathway_nodes')
      .select('*')
      .eq('id', cursor.parent_node_id)
      .maybeSingle();
    if (!parent) break;
    cursor = parent;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_interest')
    .eq('id', user.id)
    .single();

  // Next depth layer: skills until depth 3, then project nodes
  const nextDepth = node.depth + 1;
  const nextKind: 'skill' | 'project' = nextDepth >= 3 ? 'project' : 'skill';

  let branches;
  try {
    branches = await expandNodeBranches({
      interest: profile?.onboarding_interest ?? 'general interests',
      pathName: node.source_path_name ?? 'your pathway',
      completedNodeTitle: node.title,
      completedNodeDescription: node.description,
      parentChain: ancestry,
      nextKind,
    });
  } catch (err) {
    console.error('Branch expansion failed:', err);
    return NextResponse.json({ ok: true, expanded: 0 });
  }

  const toInsert = branches.map((b, i) => ({
    user_id: user.id,
    parent_node_id: node.id,
    kind: b.kind,
    status: i === 0 ? 'available' : 'locked',
    title: b.title,
    description: b.description,
    icon: null,
    source_path_id: node.source_path_id,
    source_path_name: node.source_path_name,
    depth: nextDepth,
    order_index: i,
    unlocked_at: i === 0 ? now : null,
  }));
  await supabase.from('pathway_nodes').insert(toInsert);

  // Retroactive opportunity injection: if teen has crossed the 5-completed-project
  // threshold, inject an opportunity node onto each root subtree once.
  const { count: completedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('teen_id', user.id)
    .eq('is_complete', true);

  if ((completedProjects ?? 0) >= OPPORTUNITY_GATE_PROJECTS) {
    await injectOpportunities(user.id);
  }

  return NextResponse.json({ ok: true, expanded: toInsert.length });
}

async function injectOpportunities(userId: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('opportunities_unlocked_at')
    .eq('id', userId)
    .single();
  if (profile?.opportunities_unlocked_at) return;

  const { data: roots } = await admin
    .from('pathway_nodes')
    .select('*')
    .eq('user_id', userId)
    .eq('kind', 'root');
  if (!roots || roots.length === 0) return;

  const { data: companies } = await admin
    .from('companies')
    .select('id, name, description, sector, interest_categories')
    .eq('is_active', true)
    .limit(50);
  if (!companies || companies.length === 0) return;

  const now = new Date().toISOString();
  const inserts: Array<Record<string, unknown>> = [];

  for (const root of roots) {
    // Pick a company whose sector/interest roughly matches the path name
    const pathName = (root.source_path_name ?? root.title ?? '').toLowerCase();
    const match =
      companies.find((c) =>
        (c.interest_categories ?? []).some((ic: string) =>
          pathName.includes(ic.toLowerCase())
        )
      ) ??
      companies.find((c) => pathName.includes(c.sector.toLowerCase())) ??
      companies[Math.floor(Math.random() * companies.length)];

    // Find the deepest node under this root to attach the opportunity
    const { data: subtree } = await admin
      .from('pathway_nodes')
      .select('*')
      .eq('user_id', userId)
      .eq('source_path_id', root.source_path_id)
      .order('depth', { ascending: false })
      .limit(1);
    const attachTo = subtree?.[0] ?? root;

    inserts.push({
      user_id: userId,
      parent_node_id: attachTo.id,
      kind: 'opportunity',
      status: 'available',
      title: `Reach out to ${match.name}`,
      description: match.description,
      icon: '⭐',
      source_path_id: root.source_path_id,
      source_path_name: root.source_path_name,
      company_id: match.id,
      depth: (attachTo.depth ?? 0) + 1,
      order_index: 0,
      unlocked_at: now,
    });
  }

  if (inserts.length > 0) {
    await admin.from('pathway_nodes').insert(inserts);
    await admin
      .from('profiles')
      .update({ opportunities_unlocked_at: now })
      .eq('id', userId);
  }
}
