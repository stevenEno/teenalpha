import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { QuestChain } from '@/components/incentives/QuestChain';
import { AlphaBar } from '@/components/incentives/AlphaBar';

export default async function QuestsPage() {
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

  const { data: assignment } = await supabase
    .from('incentive_assignments')
    .select('system')
    .eq('user_id', user.id)
    .single();

  if (!assignment || assignment.system !== 'quest') {
    redirect('/dashboard/incentives');
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <AlphaBar />
      <p className="text-xs text-center text-muted-foreground">Quest points convert to Alpha at 1:1</p>
      <QuestChain />
    </main>
  );
}
