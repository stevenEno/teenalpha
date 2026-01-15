import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { ConnectSteam } from '@/components/profile/ConnectSteam';
import { ConnectRoblox } from '@/components/profile/ConnectRoblox';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ConnectSocialMedia } from '@/components/profile/ConnectSocialMedia';

export default async function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and gaming connections
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              {profile.role === 'teen' && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium">Grade {profile.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium">{profile.school}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {profile.role === 'teen' && (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-4">Connect Your Accounts</h2>
              <p className="text-gray-600 mb-4">
                Connect your gaming and social media accounts to get personalized project 
                recommendations based on what you love.
              </p>
            </div>

            {/* Gaming Platforms */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Gaming Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConnectSteam
                  steamId={profile.steam_id}
                  steamProfileName={profile.steam_profile_name}
                />
                <ConnectRoblox robloxUsername={profile.roblox_username} />
              </div>
            </div>

            {/* Social Media Platforms */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Social Media (Coming Soon)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ConnectSocialMedia 
                  platform="instagram" 
                  connectedAt={profile.instagram_connected_at}
                />
                <ConnectSocialMedia 
                  platform="tiktok" 
                  connectedAt={profile.tiktok_connected_at}
                />
                <ConnectSocialMedia 
                  platform="snapchat" 
                  connectedAt={profile.snapchat_connected_at}
                />
              </div>
            </div>

            {(profile.steam_id || profile.roblox_username) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">
                  ✨ <strong>Ready for magic?</strong> We can analyze your profile
                  and recommend projects you'll actually want to build!
                </p>
                <Link href="/projects/discover">
                  <Button>
                    Discover Your Perfect Project →
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}