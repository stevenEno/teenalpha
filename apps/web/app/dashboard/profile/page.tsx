import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConnectSocialMedia } from '@/components/profile/ConnectSocialMedia';
import { MentorSettings } from '@/components/profile/MentorSettings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  // Count connected sources (social platforms)
  const connectedCount = [
    profile?.instagram_connected_at,
    profile?.tiktok_connected_at,
    profile?.snapchat_connected_at,
  ].filter(Boolean).length;

  const isMentor = profile?.role === 'mentor';
  const isTeen = profile?.role === 'teen';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              {isMentor
                ? 'How teens and parents see you, and where they book sessions.'
                : 'Connect your accounts to get personalized project recommendations.'}
            </p>
          </div>
          {isTeen && (
            <Link href="/projects/discover">
              <Button size="lg" className="bg-[#FF6B35] hover:bg-[#E85A24] text-white">
                Discover Projects
              </Button>
            </Link>
          )}
        </div>

        {/* Mentor settings — only for role='mentor' */}
        {isMentor && (
          <MentorSettings
            initial={{
              bio: profile?.bio ?? null,
              calendly_url: profile?.calendly_url ?? null,
              expertise: profile?.expertise ?? null,
            }}
          />
        )}

        {/* Progress Card — teen-only */}
        {isTeen && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {connectedCount === 0 && "Let's get started! 🚀"}
                {connectedCount === 1 && "Great progress! 🎉"}
                {connectedCount === 2 && "Almost there! ⭐"}
                {connectedCount === 3 && "All set! ✨"}
              </h3>
              <p className="text-sm text-gray-600">
                {connectedCount === 0 && "Connect at least one account to get AI-powered project recommendations"}
                {connectedCount === 1 && "Connect more accounts for even better recommendations"}
                {connectedCount === 2 && "One more to go for the most personalized experience"}
                {connectedCount === 3 && "You've connected all available sources - amazing!"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {connectedCount}/3
              </div>
              <p className="text-xs text-gray-500 mt-1">Connected</p>
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Account Connections — teen-only */}
      {isTeen && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Connected Accounts</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/profile/data">
              <Button variant="outline" size="sm">
                View Data Analysis
              </Button>
            </Link>
            <Link href="/admin/prompts">
              <Button variant="outline" size="sm">
                Manage Prompts
              </Button>
            </Link>
            {process.env.NODE_ENV === 'development' && (
              <Link href="/api/debug-sources" target="_blank">
                <Button variant="outline" size="sm">
                  Debug Data
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="grid gap-4">
          <ConnectSocialMedia
            platform="instagram"
            connectedAt={profile?.instagram_connected_at}
          />

          <ConnectSocialMedia
            platform="tiktok"
            connectedAt={profile?.tiktok_connected_at}
          />

          <ConnectSocialMedia
            platform="snapchat"
            connectedAt={profile?.snapchat_connected_at}
          />
        </div>
      </div>
      )}

      {/* Info Section — teen-only (explains social media data usage) */}
      {isTeen && (
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center space-x-2">
            <span>🔒</span>
            <span>Your Privacy Matters</span>
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>We only analyze your data to suggest projects - nothing is shared publicly</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>All analysis happens securely with AI - no humans see your raw data</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>You can disconnect any account at any time</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Data is stored anonymously and only used for recommendations</span>
            </li>
          </ul>
        </div>
      </Card>
      )}

      {/* Account Info */}
      <Card className="p-6 border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Full Name</span>
            <span className="font-medium">{profile?.full_name || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Member Since</span>
            <span className="font-medium">
              {new Date(profile?.created_at || '').toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}