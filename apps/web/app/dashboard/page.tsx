import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { MentorSection } from "@/components/mentors/MentorSection";
import { MenteesSection } from "@/components/mentors/MenteesSection";
import { ConnectedTeensSection } from "@/components/family/ConnectedTeensSection";
import { PendingParentRequests } from "@/components/family/PendingParentRequests";
import { HourBalanceWidget } from "@/components/dashboard/HourBalanceWidget";
import { SessionsWidget } from "@/components/dashboard/SessionsWidget";
import { TeenOnboarding } from "@/components/onboarding/TeenOnboarding";
import { IncentiveWidget } from "@/components/incentives/IncentiveWidget";
import { AlphaBar } from "@/components/incentives/AlphaBar";

export default async function DashboardPage() {
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
    const { data: { user }} = await supabase.auth.getUser();

    // Middleware handles the redirect to /login, but if somehow we get here without a user,
    // show an error instead of redirecting (to prevent loops)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Session Expired</h1>
                    <p className="text-gray-600 mb-4">Please log in again.</p>
                    <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
                </div>
            </div>
        );
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (profileError || !profile) {
        console.error('Profile fetch error:', profileError, 'User ID:', user.id);
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
                    <p className="text-gray-600 mb-4">Your profile could not be loaded.</p>
                    <p className="text-sm text-gray-400 mb-4">User: {user.email}</p>
                    {profileError && <p className="text-sm text-red-500 mb-4">Error: {profileError.message}</p>}
                    <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
                </div>
            </div>
        );
    }

    // Check if teen needs onboarding (first-time user detection)
    let isNewTeen = false;
    let projectCount = 0;

    if (profile.role === 'teen') {
        // Check for existing projects
        const { count: projects } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('teen_id', user.id);

        projectCount = projects || 0;

        // Check for social media data uploads
        const hasSocialData = !!(
            profile.instagram_connected_at ||
            profile.tiktok_connected_at ||
            profile.snapchat_connected_at ||
            profile.steam_id
        );

        // Check for existing startup pathways
        const { count: pathways } = await supabase
            .from('startup_pathways')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', user.id);

        // Teen is "new" if they have no projects, no social data, and no pathways
        isNewTeen = projectCount === 0 && !hasSocialData && (pathways || 0) === 0;
    }

    // Show onboarding for new teens
    if (isNewTeen) {
        return <TeenOnboarding userName={profile.full_name} />;
    }
    
    return (
        <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="text-2xl font-bold">Welcome, {profile.full_name}!</h2>

                    {profile.role === 'teen' && (
                      <div className="space-y-4">
                        {/* Alpha Progress Bar */}
                        <AlphaBar />

                        {/* Startup Pathways CTA - The Magic Moment */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">
                                🚀 Discover Your Startup Path
                              </h3>
                              <p className="text-indigo-100">
                                Upload your social media data and let AI find career paths that match your real interests.
                              </p>
                            </div>
                            <Link href="/dashboard/profile/data">
                              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
                                Explore Pathways →
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Customize Profile CTA */}
                        <div className="bg-gradient-to-r from-pink-500 to-violet-600 rounded-xl p-6 mb-2 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">
                                Customize Your Profile
                              </h3>
                              <p className="text-pink-100">
                                Add your avatar, pick a theme, set your music, and make your profile page uniquely yours.
                              </p>
                            </div>
                            <Link href="/dashboard/profile/customize">
                              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50">
                                Customize →
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Incentive System Widget */}
                        <IncentiveWidget />

                        {profile.steam_id ? (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-purple-900 mb-2">
                                  ✨ Ready for Magic?
                                </h3>
                                <p className="text-purple-700">
                                  We analyzed your Steam profile. Discover projects you'll actually want to build!
                                </p>
                              </div>
                              <Link href="/projects/discover">
                                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                                  Discover Projects →
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                              💡 <strong>Pro tip:</strong> Connect your Steam account in Profile Settings
                              to get personalized project recommendations based on games you play!
                            </p>
                          </div>
                        )}
                        
                        <p className="text-gray-600">
                          {projectCount === 0
                            ? "Ready to start building? Create your first project to get started."
                            : "Keep up the momentum! Here's your project progress."}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="border rounded-lg p-4">
                            <h3 className="font-semibold mb-2">Active Projects</h3>
                            <p className="text-3xl font-bold text-blue-600">{projectCount}</p>
                          </div>
                          <div className="border rounded-lg p-4">
                            <h3 className="font-semibold mb-2">Completed Projects</h3>
                            <p className="text-3xl font-bold text-green-600">0</p>
                          </div>
                        </div>

                        {/* Mentor Section */}
                        <MentorSection />

                        {/* Parent Connection Requests */}
                        <PendingParentRequests />

                        <div className="pt-4">
                          <Link href="/projects/new">
                            <Button size="lg" className="w-full">
                              + Create Your First Project
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    {profile.role === 'mentor' && (
                        <div className="space-y-5">
                            <p className="text-gray-600">
                                Your mentees need your guidance. Check in on their progress and provide feedback.
                            </p>

                            {/* Sessions Widget for Mentors */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SessionsWidget userRole="mentor" />
                                <HourBalanceWidget userRole="mentor" />
                            </div>

                            <MenteesSection maxMentees={profile.max_mentees || 5} />
                        </div>
                    )}
                    {profile.role === 'parent' && (
                        <div className="space-y-5">
                            <p className="text-gray-600">
                                Monitor your child's progress and connect them with mentors.
                            </p>

                            {/* Hour Balance and Sessions Widgets */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <HourBalanceWidget userRole="parent" />
                                <SessionsWidget userRole="parent" />
                            </div>

                            <ConnectedTeensSection />
                        </div>
                    )}
                </div>
            </main>
    );
}