import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/map/MapView';
import type { Company } from '@/lib/companies/schemas';

interface MapPageProps {
  searchParams: Promise<{ company?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const { company: focusCompanyId } = await searchParams;
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
    .select('*')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');

  const role = profile.role as 'teen' | 'mentor' | 'parent' | 'admin';
  const isTeen = role === 'teen';
  const hasCompletedFirstProject = !!profile.first_project_completed_at;

  // Gating: teens must finish their first project to unlock the map.
  // Parents, mentors, and admins always see it.
  if (isTeen && !hasCompletedFirstProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header profile={profile} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-md p-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              The Map of Opportunity
            </h1>
            <p className="text-gray-600 mb-6 text-lg">
              A live map of local startups, what they&apos;re building, and how you can plug in.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Locked — complete your first project to unlock the map.
              </p>
              <p className="text-sm text-amber-800">
                Build something. Attach evidence. Get your mentor&apos;s approval.
                Once every task on one project is Done, the map opens up.
              </p>
            </div>
            <Link href="/projects">
              <Button size="lg">Go to my projects</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Latest pathway for teens — drives the "your matches" highlight
  let matchedIds: string[] = [];
  if (isTeen) {
    const { data: pathway } = await supabase
      .from('pathway_matches')
      .select('matched_company_ids')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    matchedIds = pathway?.matched_company_ids ?? [];
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            The Map of Opportunity
          </h1>
          <p className="text-gray-600">
            {isTeen
              ? 'Local startups you can plug into. Your matched companies are highlighted.'
              : 'Where teens can plug in — local startups across sectors and stages.'}
          </p>
        </div>

        {!token ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
            Map unavailable — missing <code>NEXT_PUBLIC_MAPBOX_TOKEN</code>.
          </div>
        ) : (
          <MapView
            token={token}
            companies={(companies ?? []) as Company[]}
            matchedIds={matchedIds}
            focusCompanyId={focusCompanyId ?? null}
          />
        )}
      </main>
    </div>
  );
}
