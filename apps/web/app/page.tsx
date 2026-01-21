import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Landing page variants for A/B testing
const LANDING_VARIANTS = ['screen-time', 'grow', 'leapfrog', 'purpose'] as const;

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ variant?: string }>;
}) {
    const cookieStore = cookies();
    const params = await searchParams;

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

    if (user) {
        redirect('/dashboard');
    }

    // Check for variant in URL or cookie
    const requestedVariant = params.variant;

    // If a specific variant is requested, redirect to that landing page
    if (requestedVariant && LANDING_VARIANTS.includes(requestedVariant as any)) {
        redirect(`/${requestedVariant}`);
    }

    // Default landing page (original)
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Landing Page Selector Bar (for testing) */}
            <div className="bg-gray-900 text-white py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
                    <span className="text-gray-400">Test different landing pages:</span>
                    <div className="flex gap-2">
                        <Link href="/screen-time" className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700">
                            Screen Time
                        </Link>
                        <Link href="/grow" className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700">
                            Grow
                        </Link>
                        <Link href="/leapfrog" className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700">
                            Leapfrog AI
                        </Link>
                        <Link href="/purpose" className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700">
                            Purpose
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold">Teen Alpha</h1>
                        <p className="text-gray-600 mt-4 max-w-xl mx-auto">
                            Build ambitious projects with the help of AI guidance and connect with expert mentors who care about your success.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full">Get Started</Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="w-full">Sign In</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4 text-blue-600">🎯</div>
                            <h3 className="text-xl font-semibold mb-2">For Teens</h3>
                            <p className="text-gray-600">
                                Get AI-powered guidance to break down ambitious projects into manageable steps.
                                Track your progress and build an impressive portfolio.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4 text-green-600">🤝</div>
                            <h3 className="text-xl font-semibold mb-2">For Mentors</h3>
                            <p className="text-gray-600">
                                Guide up to 5 teens at a time with minimal overhead. Share your expertise
                                and watch the next generation thrive.
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-lg shadow-md">
                            <div className="text-4xl mb-4 text-yellow-600">👨‍👩‍👧</div>
                            <h3 className="text-xl font-semibold mb-2">For Parents</h3>
                            <p className="text-gray-600">
                                Connect your teen with trusted mentors from your network. Monitor progress
                                and celebrate achievements together.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
