import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { IncentiveSelector } from '@/components/incentives/IncentiveSelector';

export default async function IncentivesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'teen') {
    redirect('/dashboard');
  }

  // Check for existing assignment
  const { data: assignment } = await supabase
    .from('incentive_assignments')
    .select('system')
    .eq('user_id', user.id)
    .single();

  // If assigned, redirect to the appropriate sub-page
  if (assignment) {
    const redirectMap: Record<string, string> = {
      quest: '/dashboard/incentives/quests',
      ladder: '/dashboard/incentives/ladders',
      tracker: '/dashboard/incentives/tracker',
    };
    const target = redirectMap[assignment.system];
    if (target) redirect(target);
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <IncentiveSelector currentSystem={null} />
    </main>
  );
}
