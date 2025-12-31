import { Header } from "@/components/layout/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function DashboardPage() {
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
    const { data: { user }} = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (!profile) {
        redirect('/login');
    }
    
    return (
        <div className="min-h-screen bg-background">
            <Header profile={profile} />
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <h2 className="text-2xl font-bold">Welcome, {profile.full_name}!</h2>

                    {profile.role === 'teen' && (
                        <div className="space-y-5">
                            <p className="text-gray-600">
                                Ready to start building? Create your first projet to get started.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Active Projects</h3>
                                    <p className="text-3xl font-bold text-blue-600">0</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Completed Projects</h3>
                                    <p className="text-3xl font-bold text-green-600">0</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Mentors</h3>
                                    <p className="text-3xl font-bold text-yellow-600">0</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {profile.role === 'mentor' && (
                        <div className="space-y-5">
                            <p className="text-gray-600">
                                Your mentees need your guidance. Check in on their progress and provide feedback.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Active Mentees</h3>
                                    <p className="text-3xl font-bold text-blue-600">0 / {profile.max_mentees}</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Pending Invitations</h3>
                                    <p className="text-3xl font-bold text-green-600">0</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {profile.role === 'parent' && (
                        <div className="space-y-5">
                            <p className="text-gray-600">
                                Monitor your child's progress and connect them with mentors.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Connected Teens</h3>
                                    <p className="text-3xl font-bold text-blue-600">0</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Mentorship Connections</h3>
                                    <p className="text-3xl font-bold text-green-600">0</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}