import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { seedPathwayGraph } from '@/lib/pathway/seed';
import { PathwayGraph } from '@/components/pathway/PathwayGraph';

export default async function PathwayPage() {
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
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_interest')
    .eq('id', user.id)
    .single();

  const nodes = await seedPathwayGraph(supabase, user.id);

  // Auto-sync: if any active project-kind node has its real project marked
  // complete, complete the pathway node (and let its /api/pathway/complete
  // hook grow new branches the next time the teen interacts).
  if (nodes && nodes.length > 0) {
    const activeProjectNodes = nodes.filter(
      (n) => n.kind === 'project' && n.status === 'active' && n.project_id
    );
    if (activeProjectNodes.length > 0) {
      const projectIds = activeProjectNodes
        .map((n) => n.project_id)
        .filter((id): id is string => !!id);
      const { data: completedProjects } = await supabase
        .from('projects')
        .select('id')
        .in('id', projectIds)
        .eq('is_complete', true);
      const completedIds = new Set((completedProjects ?? []).map((p) => p.id));
      const now = new Date().toISOString();
      for (const n of activeProjectNodes) {
        if (n.project_id && completedIds.has(n.project_id)) {
          await supabase
            .from('pathway_nodes')
            .update({ status: 'completed', completed_at: now })
            .eq('id', n.id);
        }
      }
    }
  }

  if (!nodes) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-md p-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            Your Pathway
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Answer one quick question on Explore and we&apos;ll map out 5 pathways
            tailored to what you&apos;re curious about.
          </p>
          <Link href="/explore">
            <Button size="lg">Start on Explore</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Pathway</h1>
        <p className="text-gray-600">
          Five roots from what you&apos;re curious about. Build skills, ship
          projects, and unlock real opportunities at local startups.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <PathwayGraph nodes={nodes} interest={profile?.onboarding_interest ?? null} />
      </div>
    </main>
  );
}
