'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

const systems = [
  {
    id: 'quest' as const,
    name: 'Daily Quest Chain',
    description: 'Get 3-5 connected daily quests that build on each other. Complete them to earn points, level up, and build streaks.',
    alphaRate: '1 pt = 1 Alpha',
    icon: (
      <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    href: '/dashboard/incentives/quests',
    color: 'border-[#FF6B35]/30 hover:border-[#FF6B35]/60',
    selectedColor: 'border-[#FF6B35] bg-[#FF6B35]/5 ring-2 ring-[#FF6B35]/30',
  },
  {
    id: 'ladder' as const,
    name: 'Challenge Ladder',
    description: 'Join a group of 4-6 teens with shared interests. Vote on challenges and climb a 5-day ladder together.',
    alphaRate: '1 token = 5 Alpha',
    icon: (
      <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/dashboard/incentives/ladders',
    color: 'border-[#FF6B35]/30 hover:border-[#FF6B35]/60',
    selectedColor: 'border-[#FF6B35] bg-[#FF6B35]/5 ring-2 ring-[#FF6B35]/30',
  },
  {
    id: 'tracker' as const,
    name: 'Ambition Tracker',
    description: 'Set a weekly goal and AI breaks it into 7 daily tasks. Track your progress and earn stars.',
    alphaRate: '1 star = 3 Alpha',
    icon: (
      <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    href: '/dashboard/incentives/tracker',
    color: 'border-amber-200 hover:border-amber-400',
    selectedColor: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200',
  },
];

interface IncentiveSelectorProps {
  currentSystem?: string | null;
}

export function IncentiveSelector({ currentSystem }: IncentiveSelectorProps) {
  const [selected, setSelected] = useState<string | null>(currentSystem || null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleActivate = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      const response = await fetch('/api/incentive/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: selected }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign system');
      }

      const system = systems.find((s) => s.id === selected);
      if (system) {
        router.push(system.href);
      }
    } catch (err) {
      console.error('Assign system error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Choose Your Challenge System</h2>
        <p className="text-sm text-gray-600 mt-1">
          Pick one system to focus on. You can switch anytime.
        </p>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: 'var(--alpha-primary)' }}>
          <Zap className="w-3.5 h-3.5" />
          Each system earns Alpha — your unified progress score
        </div>
      </div>

      <div className="grid gap-4">
        {systems.map((system) => (
          <motion.div
            key={system.id}
            whileTap={{ scale: 0.98 }}
            animate={selected === system.id ? { scale: 1.02 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all ${
                selected === system.id ? system.selectedColor : system.color
              }`}
              onClick={() => setSelected(system.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{system.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{system.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{system.description}</p>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--alpha-primary)' }}>
                    {system.alphaRate}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    selected === system.id
                      ? 'border-[#FF6B35] bg-[#FF6B35]/50'
                      : 'border-gray-300'
                  }`}
                >
                  {selected === system.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!selected || loading}
        onClick={handleActivate}
      >
        {loading ? 'Activating...' : 'Activate'}
      </Button>
    </div>
  );
}
