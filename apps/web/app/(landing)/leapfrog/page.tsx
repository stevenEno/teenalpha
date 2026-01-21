import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Fingerprint, Lightbulb, Shield, Cpu, Sparkles } from "lucide-react";

export const metadata = {
  title: "Teen Alpha - Unlock Your Unique Skills to Leapfrog AI",
  description: "AI can do generic. You need to be irreplaceable. Discover what makes you unique and build skills AI can't replicate.",
};

export default async function LeapfrogLandingPage() {
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
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm mb-8">
              <Cpu className="w-4 h-4 mr-2" />
              The AI-proof career strategy
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              Unlock{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Unique Skills
              </span>
              <br />
              to Leapfrog AI
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              AI is coming for generic skills. The future belongs to people with unique combinations
              of interests and abilities. We help you discover yours before it's too late.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup?variant=leapfrog">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg">
                  Find My Unique Edge
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-900 px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* The Problem with AI */}
      <div className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              AI Can Do <span className="text-red-500">Generic</span>
            </h2>
            <p className="text-gray-400 text-xl">
              The skills everyone learns are the skills AI will replace first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* What AI replaces */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <Cpu className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-2xl font-bold text-red-400">AI Will Replace</h3>
              </div>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-3">→</span>
                  Generic writing and content creation
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3">→</span>
                  Basic coding and data entry
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3">→</span>
                  Standardized analysis and reporting
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3">→</span>
                  Routine customer service
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3">→</span>
                  Any skill that can be learned from a textbook
                </li>
              </ul>
            </div>

            {/* What humans keep */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <Fingerprint className="w-8 h-8 text-cyan-500 mr-3" />
                <h3 className="text-2xl font-bold text-cyan-400">Humans Will Keep</h3>
              </div>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="text-cyan-500 mr-3">→</span>
                  Unique creative vision and taste
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-500 mr-3">→</span>
                  Complex problem-solving in novel situations
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-500 mr-3">→</span>
                  Deep human connection and empathy
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-500 mr-3">→</span>
                  Cross-domain insight combinations
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-500 mr-3">→</span>
                  Skills born from genuine passion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How We Help */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How Teen Alpha Makes You <span className="text-cyan-400">Irreplaceable</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Deep Interest Mapping</h3>
              <p className="text-gray-400">
                We analyze your actual behavior (not what you think you like) to find the unique
                intersections that make you different.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Future-Proof Pathways</h3>
              <p className="text-gray-400">
                We connect your interests to emerging fields where human creativity and judgment
                matter most - and always will.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proof of Uniqueness</h3>
              <p className="text-gray-400">
                Build a portfolio of projects that showcase your specific combination of skills -
                something no AI training data includes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Parents */}
      <div className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm mb-6">
                For Parents
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Prepare your teen for a world that doesn't exist yet
              </h2>
              <p className="text-gray-400 mb-6">
                The jobs of 2035 haven't been invented. Preparing for them isn't about learning
                specific skills - it's about developing the unique combination of interests and
                abilities that make your teen irreplaceable.
              </p>
              <p className="text-gray-400">
                Teen Alpha helps your teen discover their unique edge while there's still time
                to develop it - and build a portfolio that proves it.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-4">The AI-Proof Strategy</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Discover genuine (not resume-stuffed) interests</span>
                </li>
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Build skills at the intersection of multiple fields</span>
                </li>
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Create proof of human-only capabilities</span>
                </li>
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-cyan-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Connect with mentors navigating AI change</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            AI is a tool. Make sure you're the one using it.
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Discover what makes you uniquely human - and build on it.
          </p>
          <Link href="/signup?variant=leapfrog">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
              Find My Unique Edge
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Teen Alpha - Building the next generation of builders</p>
        </div>
      </footer>
    </div>
  );
}
