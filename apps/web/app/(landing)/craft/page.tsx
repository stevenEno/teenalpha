import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Rocket, ChevronRight } from "lucide-react";
import { TrackLandingView } from "@/components/analytics/TrackLandingView";

export const metadata = {
  title: "Teen Alpha - The best way for Teens to connect to their Unique Future",
  description: "Discover your passions, build real projects, and connect with mentors who guide you toward the future you're meant for.",
};

export default async function CraftLandingPage() {
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
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <TrackLandingView variant="craft" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F7]/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <span className="font-semibold text-stone-800">Teen Alpha</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-stone-600 hover:text-stone-900 text-sm font-medium">
                Sign in
              </Link>
              <Link href="/signup?variant=craft">
                <Button size="sm" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-5">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-powered discovery for the next generation
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
            The best way for Teens to connect to their{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Unique Future
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover what makes you unique. Build projects that matter.
            Connect with mentors who guide you toward the future you're meant for.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup?variant=craft">
              <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-stone-900/20">
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="text-stone-600 hover:text-stone-900 font-medium flex items-center">
              See how it works
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Product Preview Card */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Decorative background elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-violet-200 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>

            {/* Main card */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-stone-200/50 border border-stone-200/50 overflow-hidden">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100">
                {/* Feature 1 */}
                <div className="p-8 md:p-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-3">Discover Passions</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    AI analyzes your interests to reveal hidden passions and unique strengths you didn't know you had.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-8 md:p-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <Rocket className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-3">Build Projects</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Turn interests into real projects with AI guidance. Create a portfolio that shows who you really are.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-8 md:p-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-3">Connect with Mentors</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Work with trusted adults who've been where you want to go. Real guidance for your unique path.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
              Your journey starts here
            </h2>
            <p className="text-stone-600 max-w-xl mx-auto">
              Three simple steps to connect with your unique future
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                1
              </div>
              <div className="bg-stone-50 rounded-2xl p-8 pt-10 h-full">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">Share your world</h3>
                <p className="text-stone-600">
                  Upload your social media or gaming data. We'll find patterns that reveal what truly excites you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                2
              </div>
              <div className="bg-stone-50 rounded-2xl p-8 pt-10 h-full">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">See your path</h3>
                <p className="text-stone-600">
                  AI connects your interests to real opportunities - startups, careers, and projects that fit who you are.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                3
              </div>
              <div className="bg-stone-50 rounded-2xl p-8 pt-10 h-full">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">Build with guidance</h3>
                <p className="text-stone-600">
                  Create real projects with AI help and mentor support. Graduate with a portfolio, not just a diploma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="px-6 py-20 bg-[#FAF9F7]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative">
              <p className="text-violet-200 text-sm font-medium mb-4 uppercase tracking-wide">
                For Parents
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Give your teen the gift of self-discovery
              </h2>
              <p className="text-violet-100 text-lg max-w-2xl mx-auto mb-8">
                Teen Alpha helps your child discover their unique strengths and connect with trusted mentors -
                all in a safe, structured environment you can monitor.
              </p>
              <Link href="/signup?variant=craft&role=parent">
                <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 rounded-full px-8 py-6 text-lg font-medium">
                  Sign up as a Parent
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6 leading-tight">
            Your unique future is waiting
          </h2>
          <p className="text-xl text-stone-600 mb-10">
            Join teens who are building their path, not following someone else's.
          </p>
          <Link href="/signup?variant=craft">
            <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-10 py-7 text-xl font-medium shadow-xl shadow-stone-900/20">
              Get started for free
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>
          <p className="text-stone-500 text-sm mt-6">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-stone-200 bg-[#FAF9F7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">TA</span>
            </div>
            <span className="text-stone-600 text-sm">Teen Alpha</span>
          </div>
          <p className="text-stone-500 text-sm">
            Building the next generation of builders
          </p>
        </div>
      </footer>
    </div>
  );
}
