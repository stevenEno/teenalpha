import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export default async function MobileEntryPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore - this can fail in Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignore - this can fail in Server Components
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in - go to signup
  if (!user) {
    redirect('/m/signup');
  }

  // Get profile to check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/m/signup');
  }

  // Check if onboarding is complete (has grade and social data)
  const hasSocialData = !!(profile.instagram_connected_at || profile.tiktok_connected_at);
  const hasBasicInfo = !!profile.grade;

  if (!hasBasicInfo || !hasSocialData) {
    redirect('/m/onboard');
  }

  // Onboarding complete - go to pathways
  redirect('/m/pathways');
}
