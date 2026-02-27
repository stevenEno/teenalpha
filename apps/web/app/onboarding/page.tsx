import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { GuestDataSyncer } from "@/components/auth/GuestDataSyncer";

export default async function OnboardingPage() {
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

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (!profile) {
        redirect('/login');
    }

    const hasCompletedOnboarding = 
        (profile.role === 'teen' && profile.grade) ||
        (profile.role === 'mentor' && profile.expertise?.length > 0) ||
        (profile.role === 'parent' && profile.bio);
    
    if (hasCompletedOnboarding) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <GuestDataSyncer />
            {/* Simple header with sign out */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Teen Alpha</h1>
                            <p className="text-sm text-gray-500">Complete your profile</p>
                        </div>
                        <SignOutButton variant="outline" size="sm" />
                    </div>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="bg-white py-8 px-6 rounded-xl shadow-sm">
                        <OnboardingForm initialProfile={profile} />
                    </div>
                </div>
            </div>
        </div>
    )
}