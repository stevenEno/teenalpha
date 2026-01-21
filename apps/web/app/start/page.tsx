import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { QuickStartFlow } from "@/components/onboarding/QuickStartFlow";

export const metadata = {
  title: "Get Started - Teen Alpha",
  description: "Discover your unique path in just a few steps",
};

export default async function QuickStartPage() {
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
    redirect('/signup');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/signup');
  }

  // Check if they already have social data
  const { data: socialData } = await supabase
    .from('social_media_analysis')
    .select('platform')
    .eq('profile_id', user.id)
    .limit(1);

  const hasSocialData = !!(socialData && socialData.length > 0);

  // If they've completed everything, send them to dashboard
  if (hasSocialData && profile.grade) {
    redirect('/dashboard/profile/data');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <QuickStartFlow
        profile={profile}
        hasSocialData={hasSocialData}
      />
    </div>
  );
}
