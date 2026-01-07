import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { ProjectRecommendations } from '@/components/projects/ProjectRecommendations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DiscoverPage() {
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

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check if user has connected Steam
  if (!profile.steam_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header profile={profile} />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🎮</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Steam Account First
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              To get personalized project recommendations based on the games you play,
              you need to connect your Steam account.
            </p>
            <Link href="/profile">
              <Button size="lg">
                Go to Profile Settings →
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectRecommendations />
      </main>
    </div>
  );
}