import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Header } from '@/components/layout/Header';
import { InsightsAdmin } from '@/components/admin/InsightsAdmin';

export const metadata = {
  title: 'Insights · Admin · Teen Alpha',
};

export default async function InsightsAdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Insights</h1>
          <p className="text-gray-600">
            Capture what you read about the changing career landscape. These will
            seed pathway recommendations for teens and coaching cues for mentors
            once we wire up the AI context layer.
          </p>
        </div>
        <InsightsAdmin initialInsights={insights ?? []} />
      </main>
    </div>
  );
}
