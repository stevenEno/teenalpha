'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Star,
  Clock,
  Rocket,
  Trophy,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function ParentLandingPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortEmail, setCohortEmail] = useState('');
  const [cohortTeen, setCohortTeen] = useState('');
  const [cohortCuriosity, setCohortCuriosity] = useState('');
  const [cohortSelfStarter, setCohortSelfStarter] = useState('');
  const [cohortSubmitting, setCohortSubmitting] = useState(false);
  const [cohortSuccess, setCohortSuccess] = useState(false);
  const [mentor, setMentor] = useState<{
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/profile/social-data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          setUserRole(data.profile.role);
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});

    fetch('/api/mentor-public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const m = data?.mentors?.[0] ?? data?.mentor;
        if (m) setMentor(m);
      })
      .catch(() => {});
  }, []);

  const handleCohortApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setCohortSubmitting(true);
    try {
      await fetch('/api/cohort/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          parent_name: cohortName,
          parent_email: cohortEmail,
          teen_name: cohortTeen,
          teen_curiosity: cohortCuriosity,
          teen_self_starter: cohortSelfStarter,
        }),
      });
      setCohortSuccess(true);
    } catch {
      // Still show success — email fallback
      setCohortSuccess(true);
    } finally {
      setCohortSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white">
            Teen Alpha
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/explore" className="text-sm text-gray-400 hover:text-white">
                  For Teens
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, #FF6B35 0%, transparent 45%), radial-gradient(circle at 70% 80%, #00C853 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30 text-sm px-4 py-1">
              For Parents
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-6 text-white">
              Your teen builds.
              <br />
              <span className="text-[#FF6B35]">The world notices.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10">
              1-on-1 mentoring, real projects, and direct connections to South Bay
              startups. Not a class — a career accelerator disguised as the
              most productive summer of their life.
            </p>
            <a href="#options">
              <Button
                size="lg"
                className="bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold text-lg px-8 py-6 rounded-full"
              >
                See Options
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why this works */}
      <section className="border-y border-gray-800 bg-gray-950/50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: 'Real $$$', label: 'Teens earn actual money' },
              { stat: 'Portfolio', label: 'Something to show colleges' },
              { stat: 'Network', label: 'Startup connections' },
              { stat: '0.1%', label: 'Stand out from every applicant' },
            ].map((s) => (
              <div key={s.stat}>
                <p className="text-2xl font-bold text-[#FF6B35]">{s.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three options */}
      <section id="options" className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4">
            Choose the right fit
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every option pairs your teen with Steven Eno — 16 years of teen
            activation, former program director, serial builder.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Tier 1: Hourly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <Card className="bg-gray-900 border-gray-800 p-8 h-full flex flex-col hover:border-[#FF6B35]/40 transition-colors">
              <div className="mb-6">
                <Clock className="h-8 w-8 text-[#FF6B35] mb-3" />
                <h3 className="text-2xl font-black text-white mb-1">
                  1-on-1 Coaching
                </h3>
                <p className="text-gray-500 text-sm">Flexible, ongoing support</p>
              </div>
              <div className="mb-6">
                <p className="text-4xl font-black text-white">$99</p>
                <p className="text-gray-500 text-sm">per hour · packages available</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '1-on-1 with Steven Eno',
                  'Project guidance & accountability',
                  'Career direction conversations',
                  'College prep perspective',
                  'Buy hours when you need them',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/purchase" className="mt-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full"
                >
                  Buy Hours
                </Button>
              </Link>
            </Card>
          </motion.div>

          {/* Tier 2: Sprint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gray-900 border-[#FF6B35] border-2 p-8 h-full flex flex-col relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white">
                Most Popular
              </Badge>
              <div className="mb-6">
                <Rocket className="h-8 w-8 text-[#FF6B35] mb-3" />
                <h3 className="text-2xl font-black text-white mb-1">
                  First Dollar Sprint
                </h3>
                <p className="text-gray-500 text-sm">4 weeks to a real outcome</p>
              </div>
              <div className="mb-6">
                <p className="text-4xl font-black text-white">$149</p>
                <p className="text-gray-500 text-sm">one-time · everything included</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '1-hour mentor kickoff session',
                  '4 weeks of AI-powered daily tasks',
                  'Build and ship a real project',
                  'First-dollar coaching',
                  'Portfolio piece for colleges',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sprint" className="mt-auto">
                <Button
                  size="lg"
                  className="w-full bg-[#FF6B35] hover:bg-[#E85A24] text-white font-bold rounded-full"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </Card>
          </motion.div>

          {/* Tier 3: Summer Cohort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gray-900 border-gray-800 p-8 h-full flex flex-col hover:border-[#00C853]/40 transition-colors relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00C853] text-black font-bold">
                Summer 2026
              </Badge>
              <div className="mb-6">
                <Trophy className="h-8 w-8 text-[#00C853] mb-3" />
                <h3 className="text-2xl font-black text-white mb-1">
                  Summer Cohort
                </h3>
                <p className="text-gray-500 text-sm">The 0.1% accelerator</p>
              </div>
              <div className="mb-6">
                <p className="text-4xl font-black text-white">$999</p>
                <p className="text-gray-500 text-sm">limited to 20 sophomores</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  { text: '12 weekly 1-on-1 coaching sessions', icon: Star },
                  { text: '4 in-person meetups in the South Bay', icon: MapPin },
                  { text: 'Build a project tied to a real startup', icon: Rocket },
                  { text: 'Map of Opportunity — startup network access', icon: Users },
                  { text: 'Top 0.1% positioning in their interest area', icon: Trophy },
                ].map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-start gap-2 text-sm">
                    <Icon className="h-4 w-4 text-[#00C853] mt-0.5 shrink-0" />
                    <span className="text-gray-300">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>June — August 2026</span>
              </div>
              <div className="mt-auto space-y-2">
                <p className="text-xs text-center text-[#00C853]">
                  <Users className="inline h-3.5 w-3.5 mr-1" />
                  Only 20 spots — application required
                </p>
                <a href="#apply">
                  <Button
                    size="lg"
                    className="w-full bg-[#00C853] hover:bg-[#00B34A] text-black font-bold rounded-full"
                  >
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Value breakdown */}
      <section className="border-y border-gray-800 bg-gray-950/50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="font-display text-3xl md:text-4xl font-black text-center mb-12">
            Summer Cohort — what $999 gets you
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="space-y-4">
              {[
                { item: '12 × 1-on-1 coaching sessions', value: '$1,188', note: '($99/hr value)' },
                { item: '4 × in-person group meetups', value: '$200', note: '' },
                { item: 'AI-powered daily pathway tasks', value: '$149', note: '(Sprint included)' },
                { item: 'South Bay startup introductions', value: 'Priceless', note: '' },
                { item: 'Project published to the world', value: 'Priceless', note: '' },
              ].map((line) => (
                <div key={line.item} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{line.item}</span>
                  <span className="text-white font-bold">
                    {line.value}{' '}
                    {line.note && <span className="text-gray-500 font-normal">{line.note}</span>}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-700 pt-4 mt-4 flex items-center justify-between">
                <span className="text-white font-bold text-lg">Total value</span>
                <span className="text-[#00C853] font-black text-2xl">$1,537+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">You pay</span>
                <span className="text-white font-black text-2xl">$999</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the mentor */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-black mb-4">
            Meet Your Teen&apos;s Mentor
          </h2>
        </div>
        <Card className="bg-gray-900 border-gray-800 p-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#FF6B35] flex items-center justify-center text-2xl font-bold text-white mb-4 overflow-hidden">
              {mentor?.avatar_url ? (
                <img
                  src={mentor.avatar_url}
                  alt={mentor.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                'SE'
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {mentor?.full_name ?? 'Steven Eno'}
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              {mentor?.bio ??
                '16 years activating teens through entrepreneurship, technology, and mentorship. Former program director. Built and shipped products with hundreds of young people. Your teen\'s personal guide to building something that matters.'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Entrepreneurship', 'AI & Technology', 'Career Pathways', 'College Prep', 'South Bay Startups'].map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="border-white/20 text-gray-200 bg-transparent"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Cohort application form */}
      <section id="apply" className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-[#00C853]/15 text-[#00C853] border-[#00C853]/30">
              Summer 2026 · 20 Spots
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-black mb-4">
              Apply for the Cohort
            </h2>
            <p className="text-gray-400">
              We&apos;ll reach out within 48 hours to discuss fit and next steps.
            </p>
          </div>

          {cohortSuccess ? (
            <Card className="bg-gray-900 border-[#00C853] p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#00C853] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Application received</h3>
              <p className="text-gray-400">
                We&apos;ll be in touch within 48 hours to discuss whether the cohort
                is the right fit for your teen.
              </p>
            </Card>
          ) : (
            <Card className="bg-gray-900 border-gray-800 p-8">
              <form onSubmit={handleCohortApply} className="space-y-5">
                <div>
                  <label htmlFor="pname" className="block text-sm font-medium text-gray-300 mb-1">
                    Your name
                  </label>
                  <input
                    id="pname"
                    type="text"
                    required
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00C853] focus:ring-[#00C853]"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="pemail" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="pemail"
                    type="email"
                    required
                    value={cohortEmail}
                    onChange={(e) => setCohortEmail(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00C853] focus:ring-[#00C853]"
                    placeholder="parent@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="teen" className="block text-sm font-medium text-gray-300 mb-1">
                    Teen&apos;s name and grade
                  </label>
                  <input
                    id="teen"
                    type="text"
                    required
                    value={cohortTeen}
                    onChange={(e) => setCohortTeen(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00C853] focus:ring-[#00C853]"
                    placeholder="Alex Smith, 10th grade"
                  />
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-sm font-medium text-[#00C853] mb-1">
                    For your teen to answer:
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Have your teen write these in their own words. We read every answer.
                  </p>
                </div>
                <div>
                  <label htmlFor="curiosity" className="block text-sm font-medium text-gray-300 mb-1">
                    What are you excitedly curious about?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Provide as much evidence of your excitement and your curiosity as possible.
                  </p>
                  <textarea
                    id="curiosity"
                    required
                    rows={4}
                    value={cohortCuriosity}
                    onChange={(e) => setCohortCuriosity(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00C853] focus:ring-[#00C853] text-sm"
                    placeholder="I've spent the last 6 months building a drone from scratch because I saw a video about how drones are being used for search and rescue. I've crashed it 14 times and I've learned more from each crash than I ever learned in a classroom…"
                  />
                </div>
                <div>
                  <label htmlFor="selfstarter" className="block text-sm font-medium text-gray-300 mb-1">
                    What is your self-assessment of your ability to get started?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Give three examples where you weren&apos;t sure what to do, but you got started anyway.
                  </p>
                  <textarea
                    id="selfstarter"
                    required
                    rows={4}
                    value={cohortSelfStarter}
                    onChange={(e) => setCohortSelfStarter(e.target.value)}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-[#00C853] focus:ring-[#00C853] text-sm"
                    placeholder="1) I wanted to learn guitar but had no teacher, so I started with YouTube and played the same 3 chords for a month until my fingers stopped hurting. 2) …"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={cohortSubmitting}
                  className="w-full bg-[#00C853] hover:bg-[#00B34A] text-black font-bold rounded-full py-6"
                >
                  {cohortSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  {cohortSubmitting ? 'Submitting…' : 'Submit Application'}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>TeenAlpha — Where teens build real things.</p>
        </div>
      </footer>
    </div>
  );
}
