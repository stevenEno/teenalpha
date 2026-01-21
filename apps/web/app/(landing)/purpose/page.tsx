import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Map, Mountain, Heart, Users, Route } from "lucide-react";

export const metadata = {
  title: "Teen Alpha - Find Your Unique Path to Purpose",
  description: "Get off the highway to mediocrity. Discover what actually matters to you and build a life around it.",
};

export default async function PurposeLandingPage() {
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
    <div className="min-h-screen bg-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-orange-50"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-200/50 border border-amber-300 text-amber-800 text-sm font-medium mb-8">
              <Compass className="w-4 h-4 mr-2" />
              For teens who want more than "good enough"
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight max-w-4xl mx-auto">
              Get Off the Highway to Mediocrity.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                Find Your Path to Purpose.
              </span>
            </h1>

            <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
              Everyone's following the same path: grades, test scores, "well-rounded" activities.
              But the most fulfilled people took detours. We help you find yours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup?variant=purpose">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg">
                  Start My Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* The Highway vs The Path */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* The Highway */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gray-200 rounded-full opacity-50"></div>
              <div className="relative bg-gray-100 rounded-2xl p-8">
                <Route className="w-12 h-12 text-gray-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-4">The Highway</h3>
                <p className="text-gray-500 mb-6">Where everyone's going the same direction</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    Same AP classes as everyone else
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    Same extracurriculars to check boxes
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    Same summer programs for "the resume"
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    Same anxiety about not being different
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    Same confusion about what you actually want
                  </li>
                </ul>
              </div>
            </div>

            {/* Your Path */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-200 rounded-full opacity-50"></div>
              <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
                <Mountain className="w-12 h-12 text-amber-600 mb-6" />
                <h3 className="text-2xl font-bold text-amber-900 mb-4">Your Path</h3>
                <p className="text-amber-700 mb-6">Where you discover who you're meant to become</p>
                <ul className="space-y-3 text-amber-800">
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-3">✦</span>
                    Discover what genuinely lights you up
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-3">✦</span>
                    Build things that matter to <em>you</em>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-3">✦</span>
                    Find mentors who've walked similar paths
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-3">✦</span>
                    Create a portfolio of meaningful work
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-3">✦</span>
                    Wake up excited about what you're building
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How We Help */}
      <div className="py-20 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How We Help You Find Your Path
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your path is already inside you. We just help you see it clearly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Map Your Interests</h3>
              <p className="text-gray-600">
                We analyze your social media to find what you actually engage with -
                not what you think you should like. The patterns reveal your true north.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Compass className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Chart Your Course</h3>
              <p className="text-gray-600">
                We connect your interests to real opportunities - not generic career paths,
                but specific journeys that match who you actually are.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Walk With Guides</h3>
              <p className="text-gray-600">
                Work with mentors who've found their own purpose and can help you
                navigate the terrain. Real guidance from real people.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Parents */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-200 text-amber-800 text-sm mb-6">
                  For Parents
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Help your teen find meaning, not just metrics
                </h2>
                <p className="text-gray-700 mb-6">
                  The happiest, most successful adults didn't follow a prescribed path.
                  They found what mattered to them and built lives around it.
                </p>
                <p className="text-gray-700">
                  Teen Alpha helps your teen start that journey now - with structure,
                  safety, and real mentorship every step of the way.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Trusted Adults</h4>
                      <p className="text-gray-600 text-sm">Vetted mentors from your network who care about your teen's journey</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start">
                    <Map className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Visible Progress</h4>
                      <p className="text-gray-600 text-sm">Track real projects and meaningful milestones, not just busy work</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start">
                    <Heart className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Genuine Growth</h4>
                      <p className="text-gray-600 text-sm">Watch your teen develop confidence in who they're becoming</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-16 bg-amber-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-medium text-white italic mb-6">
            "The two most important days in your life are the day you are born
            and the day you find out why."
          </blockquote>
          <p className="text-amber-200">— Mark Twain</p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Your path is waiting
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stop following the crowd. Start finding your purpose.
          </p>
          <Link href="/signup?variant=purpose">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg font-semibold">
              Begin My Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-amber-200">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Teen Alpha - Building the next generation of builders</p>
        </div>
      </footer>
    </div>
  );
}
