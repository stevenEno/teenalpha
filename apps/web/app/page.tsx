import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
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

    if (user) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-5xl font-bold">Teen Alpha</h1>
              <p className="text-gray-600">
                Build ambitious projects with the help of AI guidance and connet with expert mentors who care about your success.
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
    );
}