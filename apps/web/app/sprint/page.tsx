'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  DollarSign,
  Users,
  MessageCircle,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Sprint {
  id: string;
  title: string;
  description: string;
  price: number;
  price_formatted: string;
  duration_weeks: number;
  max_participants: number;
  enrolled_count: number;
  spots_remaining: number;
  includes_session_hours: number;
  mentor: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    expertise: string[] | null;
  };
}

const weekBreakdown = [
  {
    week: 1,
    title: 'Discover Your Project',
    icon: MessageCircle,
    color: 'from-blue-500 to-cyan-500',
    description:
      '1-on-1 session with your mentor. Talk about what you love, what you\'re good at, and pick a project that gets you fired up.',
    outcome: 'Walk away with YOUR project idea',
  },
  {
    week: 2,
    title: 'Start Building',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    description:
      'Daily AI-powered tasks break your project into bite-sized steps. Build something real — not homework, not theory.',
    outcome: 'Working prototype or first version',
  },
  {
    week: 3,
    title: 'Level Up',
    icon: Rocket,
    color: 'from-orange-500 to-red-500',
    description:
      'Polish your project, get feedback, and prepare to launch. Your mentor checks in to make sure you\'re on track.',
    outcome: 'Something you\'re proud to show off',
  },
  {
    week: 4,
    title: 'Ship & Earn',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    description:
      'Launch your project into the world. Make your first sale, get your first customer, earn your first dollar. For real.',
    outcome: 'Your first dollar earned',
  },
];

interface ConnectedTeen {
  id: string;
  full_name: string | null;
}

export default function SprintPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [connectedTeens, setConnectedTeens] = useState<ConnectedTeen[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sprints')
      .then((res) => res.json())
      .then((data) => setSprints(data.sprints || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Check if logged in and fetch role + teens
    fetch('/api/profile/social-data')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.profile) {
          setUserRole(data.profile.role);
          if (data.profile.role === 'parent') {
            fetch('/api/family/connections')
              .then((res) => res.json())
              .then((cData) => {
                const verified = (cData.connections || [])
                  .filter((c: { verified: boolean }) => c.verified)
                  .map((c: { teen: ConnectedTeen }) => c.teen);
                setConnectedTeens(verified);
              })
              .catch(console.error);
          }
        }
      })
      .catch(() => {
        // Not logged in — that's fine
      });
  }, []);

  async function handleEnroll(sprintId: string, teenId: string) {
    setEnrolling(true);
    setEnrollError(null);
    try {
      const res = await fetch('/api/sprints/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint_id: sprintId, teen_id: teenId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollError(data.error || 'Failed to start checkout');
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setEnrollError('Something went wrong. Please try again.');
    } finally {
      setEnrolling(false);
    }
  }

  const sprint = sprints[0]; // Show the first active sprint
  const isParent = userRole === 'parent';
  const isLoggedIn = userRole !== null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-green-900/30" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-1">
              4 weeks. 1 project. Your first dollar.
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              First Dollar
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Sprint
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10">
              Build something real. Ship it to the world.
              <br />
              Earn your first dollar — in 4 weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg px-8 py-6 rounded-full"
                >
                  Join the Sprint
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-900 text-lg px-8 py-6 rounded-full"
                >
                  How It Works
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-gray-800 bg-gray-950/50">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">4 weeks</p>
            <p className="text-sm text-gray-500">Start to finish</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">1-on-1</p>
            <p className="text-sm text-gray-500">Mentor session</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">Real $$$</p>
            <p className="text-sm text-gray-500">Not fake credits</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">Your project</p>
            <p className="text-sm text-gray-500">Not someone else&apos;s idea</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg">
            Four weeks. Four phases. One real outcome.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {weekBreakdown.map((week, i) => (
            <motion.div
              key={week.week}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-gray-900 border-gray-800 p-6 h-full hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${week.color} flex items-center justify-center`}
                  >
                    <week.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Week {week.week}
                    </p>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {week.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {week.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        {week.outcome}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For parents section */}
      <section className="bg-gray-950 border-y border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                For Parents
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                More than a class.
                <br />A real-world result.
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                Your teen won&apos;t just learn — they&apos;ll build something real,
                ship it, and earn their first dollar. That&apos;s a college essay,
                a portfolio piece, and a life lesson in one.
              </p>
              <ul className="space-y-4">
                {[
                  '1-on-1 mentoring from an experienced educator',
                  'AI-powered daily tasks keep them on track',
                  'Real project they can show colleges & employers',
                  'First entrepreneurial experience — earning real money',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                  Investment
                </p>
                <p className="text-5xl font-black text-white mb-2">
                  {loading ? '...' : sprint?.price_formatted || '$149'}
                </p>
                <p className="text-gray-500 mb-6">
                  Everything included. No hidden fees.
                </p>
                <div className="space-y-3 text-left mb-8">
                  {[
                    '1-hour mentor session (Week 1)',
                    '4 weeks of AI-powered daily tasks',
                    'Project guidance & feedback',
                    'Launch support & first-dollar coaching',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
                {sprint && sprint.spots_remaining > 0 && (
                  <p className="text-sm text-orange-400 mb-4">
                    <Users className="inline h-4 w-4 mr-1" />
                    {sprint.spots_remaining} spot{sprint.spots_remaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
                {enrollError && (
                  <p className="text-sm text-red-400 mb-4">{enrollError}</p>
                )}
                {isParent && sprint && connectedTeens.length > 0 ? (
                  <div className="space-y-2">
                    {connectedTeens.map((teen) => (
                      <Button
                        key={teen.id}
                        size="lg"
                        disabled={enrolling}
                        onClick={() => handleEnroll(sprint.id, teen.id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6 rounded-full"
                      >
                        {enrolling ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-5 w-5" />
                        )}
                        Enroll {teen.full_name || 'Your Teen'}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Link href={isLoggedIn ? '/dashboard/purchase' : '/signup'}>
                    <Button
                      size="lg"
                      className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6 rounded-full"
                    >
                      {isLoggedIn ? 'Go to Dashboard' : 'Enroll Your Teen'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mentor section */}
      {sprint?.mentor && (
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Your Mentor
            </h2>
          </div>
          <Card className="bg-gray-900 border-gray-800 p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold mb-4">
                {sprint.mentor.avatar_url ? (
                  <img
                    src={sprint.mentor.avatar_url}
                    alt={sprint.mentor.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  sprint.mentor.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {sprint.mentor.full_name}
              </h3>
              {sprint.mentor.bio && (
                <p className="text-gray-400 mb-4 max-w-md">
                  {sprint.mentor.bio}
                </p>
              )}
              {sprint.mentor.expertise && sprint.mentor.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {sprint.mentor.expertise.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="border-gray-700 text-gray-400"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Final CTA */}
      <section className="border-t border-gray-800 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Ready to earn your
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              first dollar?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            4 weeks from now, you&apos;ll have built something real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-black font-bold text-lg px-8 py-6 rounded-full"
              >
                Join the Sprint
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-900 text-lg px-8 py-6 rounded-full"
              >
                Explore First
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>TeenAlpha &mdash; Where teens build real things.</p>
        </div>
      </footer>
    </div>
  );
}
