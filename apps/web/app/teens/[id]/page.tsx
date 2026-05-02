import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicTeenProfile({ params }: PageProps) {
  const { id } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, onboarding_interest, profile_public, role, first_project_completed_at')
    .eq('id', id)
    .eq('role', 'teen')
    .single();

  if (!profile || !profile.profile_public) notFound();

  const fullName = profile.full_name ?? 'A Teen';
  const parts = fullName.split(' ');
  const displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

  const { data: streak } = await admin
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', id)
    .maybeSingle();

  const { count: completedNodes } = await admin
    .from('pathway_nodes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('status', 'completed');

  const { count: completedProjects } = await admin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('teen_id', id)
    .eq('is_complete', true);

  const { data: roots } = await admin
    .from('pathway_nodes')
    .select('title, icon, status')
    .eq('user_id', id)
    .eq('kind', 'root')
    .order('order_index');

  const currentStreak = streak?.current_streak ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">Teen Alpha</Link>
          <Link href="/explore">
            <Button size="sm" className="bg-[#FF6B35] hover:bg-[#E85A24] text-white">
              Build your own pathway
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FF6B35] flex items-center justify-center text-xl font-bold text-white mx-auto mb-4">
            {displayName[0]}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h1>
          {profile.onboarding_interest && (
            <p className="text-gray-600 mb-4">Curious about: {profile.onboarding_interest}</p>
          )}
          <div className="flex justify-center gap-6 mb-6">
            {currentStreak > 0 && (
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center text-orange-500">
                  <Flame className="w-5 h-5" />
                  <span className="text-2xl font-bold">{currentStreak}</span>
                </div>
                <p className="text-xs text-gray-500">day streak</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{completedNodes ?? 0}</p>
              <p className="text-xs text-gray-500">steps completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{completedProjects ?? 0}</p>
              <p className="text-xs text-gray-500">projects shipped</p>
            </div>
          </div>
        </div>

        {roots && roots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pathways</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roots.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl border-2 p-4 text-center ${
                    r.status === 'completed'
                      ? 'border-green-500 bg-green-50'
                      : r.status === 'active'
                      ? 'border-[#FF6B35] bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {r.icon && <div className="text-xl mb-1">{r.icon}</div>}
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Want to build your own pathway?</p>
          <Link href="/explore">
            <Button size="lg" className="bg-[#FF6B35] hover:bg-[#E85A24] text-white rounded-full">
              Start on Explore →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
