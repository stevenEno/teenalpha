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
import { OnboardingAlphaToast } from "@/components/explore/OnboardingAlphaToast";
import { FoundingMentorWidget } from "@/components/dashboard/FoundingMentorWidget";
import { SprintWidget } from "@/components/sprint/SprintWidget";

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
                    <p className="text-muted-foreground mb-4">Please log in again.</p>
                    <a href="/login" className="text-primary hover:underline font-medium">Go to Login</a>
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
                    <p className="text-sm text-muted-foreground mb-4">User: {user.email}</p>
                    {profileError && <p className="text-sm text-destructive mb-4">Error: {profileError.message}</p>}
                    <a href="/login" className="text-primary hover:underline font-medium">Go to Login</a>
                </div>
            </div>
        );
    }

    // Check if teen needs onboarding (first-time user detection)
    let isNewTeen = false;
    let projectCount = 0;
    let onboardingInterest: string | null = null;
    let onboardingAlphaAwarded = false;

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

        // Get onboarding data for Alpha toast
        onboardingInterest = profile.onboarding_interest || null;
        onboardingAlphaAwarded = profile.onboarding_alpha_awarded || false;

        // Teen is "new" if they have no projects, no social data, no pathways, and no onboarding interest
        isNewTeen = projectCount === 0 && !hasSocialData && (pathways || 0) === 0 && !onboardingInterest;
    }

    // Show onboarding for new teens
    if (isNewTeen) {
        return <TeenOnboarding userName={profile.full_name} />;
    }
    
    return (
        <main className="container mx-auto px-4 py-8">
            {/* Onboarding Alpha Toast */}
            {profile.role === 'teen' && onboardingInterest && (
                <OnboardingAlphaToast
                    onboardingInterest={onboardingInterest}
                    alphaAwarded={onboardingAlphaAwarded}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="text-2xl font-bold">Welcome, {profile.full_name}!</h2>

                    {profile.role === 'teen' && (
                      <div className="space-y-4">
                        {/* Sprint Progress (if enrolled) */}
                        <SprintWidget />

                        {/* Alpha Progress Bar */}
                        <AlphaBar />

                        {/* Founding Mentor 1-on-1 Coaching CTA */}
                        <FoundingMentorWidget context="dashboard" />

                        {/* Startup Pathways CTA */}
                        <div className="bg-card border border-border rounded-xl p-6 mb-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold mb-1 text-foreground">
                                Your social data → 5 career paths
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                Upload Instagram/TikTok/Snapchat data and let AI find paths that match your real interests.
                              </p>
                            </div>
                            <Link href="/dashboard/profile/data">
                              <Button size="lg">Explore pathways</Button>
                            </Link>
                          </div>
                        </div>

                        {/* Customize Profile CTA */}
                        <div className="bg-card border border-border rounded-xl p-6 mb-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold mb-1 text-foreground">
                                Make your profile yours
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                Pick a theme, set your music, add widgets. Your profile page, your space.
                              </p>
                            </div>
                            <Link href="/dashboard/profile/customize">
                              <Button size="lg" variant="outline">Customize</Button>
                            </Link>
                          </div>
                        </div>

                        {/* Messaging CTA */}
                        <div className="bg-card border border-border rounded-xl p-6 mb-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold mb-1 text-foreground">
                                Chat with other teens
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                Messages, stickers, streaks. Build Alpha by staying in touch.
                              </p>
                            </div>
                            <Link href="/messages">
                              <Button size="lg" variant="outline">Messages</Button>
                            </Link>
                          </div>
                        </div>

                        {/* Incentive System Widget */}
                        <IncentiveWidget />

                        {profile.steam_id ? (
                          <div className="bg-card border border-border rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-foreground mb-1">
                                  Your Steam profile → project ideas
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  Analyzed. Discover projects matched to games you actually play.
                                </p>
                              </div>
                              <Link href="/projects/discover">
                                <Button size="lg">Discover projects</Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted border border-border rounded-lg p-4 mb-6">
                            <p className="text-sm text-foreground">
                              <strong>Tip:</strong> connect your Steam account in Profile Settings
                              for personalized project recommendations based on games you play.
                            </p>
                          </div>
                        )}

                        <p className="text-muted-foreground">
                          {projectCount === 0
                            ? "Ready to start building? Create your first project to get started."
                            : "Keep up the momentum! Here's your project progress."}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="border border-border rounded-lg p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Projects</h3>
                            <p className="text-3xl font-bold text-foreground tabular-nums">{projectCount}</p>
                          </div>
                          <div className="border border-border rounded-lg p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed Projects</h3>
                            <p className="text-3xl font-bold text-foreground tabular-nums">0</p>
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