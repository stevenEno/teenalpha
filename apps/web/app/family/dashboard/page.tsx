import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { StreakBadge } from '@/components/streaks/StreakBadge';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Flame } from 'lucide-react';

export default async function FamilyDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'parent') redirect('/dashboard');

  const { data: connections } = await supabase
    .from('family_connections')
    .select('teen_id, profiles!family_connections_teen_id_fkey(id, full_name, onboarding_interest, first_project_completed_at)')
    .eq('parent_id', user.id)
    .eq('verified', true);

  const teens = (connections ?? []).map((c: Record<string, unknown>) => {
    const p = c.profiles;
    return Array.isArray(p) ? p[0] : p;
  }).filter(Boolean) as Array<Record<string, unknown>>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Family Dashboard</h1>
        <p className="text-gray-600 mb-8">See how your teen is progressing toward real opportunities.</p>

        {teens.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
            No connected teens yet. Ask your teen to sign up and connect from their dashboard.
          </div>
        ) : (
          <div className="space-y-6">
            {teens.map((teen: Record<string, unknown>) => (
              <TeenProgressCard key={String(teen.id)} teen={teen} supabase={supabase} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

async function TeenProgressCard({ teen, supabase }: { teen: Record<string, unknown>; supabase: Awaited<ReturnType<typeof createServerClient>> }) {
  const teenId = teen.id as string;

  const { count: completedNodes } = await supabase
    .from('pathway_nodes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', teenId)
    .eq('status', 'completed');

  const { count: completedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('teen_id', teenId)
    .eq('is_complete', true);

  const projectsUntilMap = Math.max(0, 5 - (completedProjects ?? 0));

  const { data: recentEvents } = await supabase
    .from('activity_events')
    .select('*')
    .eq('actor_id', teenId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: nextNode } = await supabase
    .from('pathway_nodes')
    .select('title')
    .eq('user_id', teenId)
    .eq('status', 'available')
    .order('depth', { ascending: true })
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{String(teen.full_name)}</h2>
          {typeof teen.onboarding_interest === 'string' && (
            <p className="text-sm text-gray-500">Curious about: {String(teen.onboarding_interest)}</p>
          )}
        </div>
        <StreakBadge userId={teenId} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{completedNodes ?? 0}</p>
          <p className="text-xs text-gray-500">Steps completed</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{completedProjects ?? 0}</p>
          <p className="text-xs text-gray-500">Projects shipped</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${projectsUntilMap === 0 ? 'text-green-600' : 'text-[#FF6B35]'}`}>
            {projectsUntilMap === 0 ? '✓' : projectsUntilMap}
          </p>
          <p className="text-xs text-gray-500">
            {projectsUntilMap === 0 ? 'Map unlocked' : 'Projects until startup access'}
          </p>
        </div>
      </div>

      {nextNode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-900">
            <strong>Next step:</strong> {nextNode.title}
          </p>
        </div>
      )}

      {(recentEvents?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Recent activity</p>
          <ul className="space-y-2">
            {recentEvents!.map((ev: Record<string, unknown>) => (
              <li key={String(ev.id)} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                <span>{String(ev.title)}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(String(ev.created_at)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
