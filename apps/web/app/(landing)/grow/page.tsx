import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, BookOpen, Users, Target, Star, Zap } from "lucide-react";

export const metadata = {
  title: "Teen Alpha - Grow Beyond Grades",
  description: "Grades tell one story. Your projects tell a better one. Build a portfolio that actually matters.",
};

export default async function GrowLandingPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-8">
            <TrendingUp className="w-4 h-4 mr-2" />
            The new college differentiator
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Grow
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              {" "}Beyond{" "}
            </span>
            Grades
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Everyone has a GPA. Not everyone has a portfolio of real projects guided by industry mentors.
            Stand out by showing what you can actually <em>do</em>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup?variant=grow">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg">
                Start Building Your Portfolio
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-emerald-600">85%</div>
              <div className="text-gray-500 text-sm">of employers value projects over GPA</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600">3x</div>
              <div className="text-gray-500 text-sm">more memorable than test scores</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600">100%</div>
              <div className="text-gray-500 text-sm">yours to keep forever</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Problem */}
            <div className="bg-red-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6">The Old Way</h3>
              <ul className="space-y-4">
                <li className="flex items-start text-red-700">
                  <span className="text-red-500 mr-3">✗</span>
                  Chase the same grades as everyone else
                </li>
                <li className="flex items-start text-red-700">
                  <span className="text-red-500 mr-3">✗</span>
                  Join clubs you don't really care about
                </li>
                <li className="flex items-start text-red-700">
                  <span className="text-red-500 mr-3">✗</span>
                  Write essays about "passion" you can't prove
                </li>
                <li className="flex items-start text-red-700">
                  <span className="text-red-500 mr-3">✗</span>
                  Hope your application looks different somehow
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-emerald-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-emerald-900 mb-6">The Teen Alpha Way</h3>
              <ul className="space-y-4">
                <li className="flex items-start text-emerald-700">
                  <span className="text-emerald-500 mr-3">✓</span>
                  Discover what you're genuinely interested in
                </li>
                <li className="flex items-start text-emerald-700">
                  <span className="text-emerald-500 mr-3">✓</span>
                  Build real projects with mentor guidance
                </li>
                <li className="flex items-start text-emerald-700">
                  <span className="text-emerald-500 mr-3">✓</span>
                  Create tangible evidence of your abilities
                </li>
                <li className="flex items-start text-emerald-700">
                  <span className="text-emerald-500 mr-3">✓</span>
                  Stand out with work you can actually show
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Teen Alpha Works
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We help you find your unique path, then give you the tools and support to walk it.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Discover</h3>
              <p className="text-gray-500 text-sm">
                AI analyzes your social data to find your unique interests
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose</h3>
              <p className="text-gray-500 text-sm">
                Pick from personalized career paths that match you
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-500 text-sm">
                Get matched with mentors who work in your field of interest
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Build</h3>
              <p className="text-gray-500 text-sm">
                Complete real projects with guidance every step of the way
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Parents */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm mb-6">
            For Parents
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Help your teen build something that lasts
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Grades fade from memory. A portfolio of real projects creates lasting evidence
            of capability, creativity, and drive that colleges and employers actually value.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Focused Growth</h3>
              <p className="text-gray-500 text-sm">Structured projects with clear milestones and mentor oversight</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl mb-3">👀</div>
              <h3 className="font-semibold mb-2">Full Visibility</h3>
              <p className="text-gray-500 text-sm">Track progress and see exactly what your teen is building</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold mb-2">Trusted Mentors</h3>
              <p className="text-gray-500 text-sm">Connect your teen with vetted professionals from your network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to grow beyond the transcript?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start building your portfolio today. Your future self will thank you.
          </p>
          <Link href="/signup?variant=grow">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg font-semibold">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Teen Alpha - Building the next generation of builders</p>
        </div>
      </footer>
    </div>
  );
}
