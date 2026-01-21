import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Rocket, Briefcase, Users, Sparkles, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Teen Alpha - Transform Screen Time into Portfolio Time",
  description: "Turn your social media habits into career-launching projects. AI-powered insights meet real mentorship.",
};

export default async function ScreenTimeLandingPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm mb-8">
              <Smartphone className="w-4 h-4 mr-2" />
              Your scroll history is actually valuable
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              Transform{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                Screen Time
              </span>
              <br />
              into Portfolio Time
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              We analyze your Instagram, TikTok, and Snapchat to discover your unique interests,
              then connect you with startup paths and mentors who can help you turn those interests into real projects.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/signup?variant=screen-time">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-6 text-lg">
                  Discover My Path
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg">
                  I Have an Account
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <p className="text-gray-500 text-sm">
              Join teens who are building real portfolios, not just scrolling feeds
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-slate-900/50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            From Scrolling to Building in 3 Steps
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Your social media already knows what you love. We just help you do something with it.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Upload Your Data</h3>
              <p className="text-gray-400">
                Export your Instagram, TikTok, or Snapchat data (it takes 2 minutes).
                Your data stays private - we just analyze the patterns.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Discover Your Path</h3>
              <p className="text-gray-400">
                Our AI finds the hidden patterns in what you engage with and maps them to
                real career opportunities in startups and tech.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <Rocket className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Build Real Projects</h3>
              <p className="text-gray-400">
                Choose a pathway, get a project roadmap, and work with mentors who
                actually care about helping you succeed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Parents Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm mb-6">
                For Parents
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Turn "stop scrolling" into "keep building"
              </h2>
              <p className="text-gray-400 mb-8">
                Instead of fighting screen time, redirect it. Teen Alpha helps your teen
                discover what genuinely interests them and channel that energy into
                portfolio-worthy projects with adult supervision.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">See exactly what interests drive your teen's engagement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Connect them with vetted mentors from your network</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Track real progress on projects that matter for college apps</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-8 border border-emerald-500/30">
              <div className="text-6xl mb-4">👨‍👩‍👧</div>
              <blockquote className="text-lg text-gray-300 italic">
                "My daughter spent hours on TikTok. Now she spends that time building
                an actual app inspired by what she discovered she loved."
              </blockquote>
              <p className="text-emerald-400 mt-4 font-medium">- Parent of a Teen Alpha user</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Your feed knows you better than you think
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's turn those insights into your competitive advantage.
          </p>
          <Link href="/signup?variant=screen-time">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Teen Alpha - Building the next generation of builders</p>
        </div>
      </footer>
    </div>
  );
}
