import { Header } from "@/components/layout/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { MenteesSection } from "@/components/mentors/MenteesSection";
import { SessionsWidget } from "@/components/dashboard/SessionsWidget";
import { HourBalanceWidget } from "@/components/dashboard/HourBalanceWidget";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MenteesPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
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

  // Only mentors can access this page
  if (profile.role !== 'mentor') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Mentees</h1>
              <p className="text-gray-600">
                Manage your mentees and track their progress
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SessionsWidget userRole="mentor" />
            <HourBalanceWidget userRole="mentor" />
          </div>

          {/* Mentees List */}
          <MenteesSection maxMentees={profile.max_mentees || 5} />
        </div>
      </main>
    </div>
  );
}
