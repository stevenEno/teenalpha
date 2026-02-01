'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface AssignmentData {
  system: 'quest' | 'ladder' | 'tracker';
}

const systemInfo = {
  quest: {
    name: 'Quest Chain',
    href: '/dashboard/incentives/quests',
    color: 'from-indigo-500 to-blue-600',
  },
  ladder: {
    name: 'Challenge Ladder',
    href: '/dashboard/incentives/ladders',
    color: 'from-purple-500 to-pink-600',
  },
  tracker: {
    name: 'Ambition Tracker',
    href: '/dashboard/incentives/tracker',
    color: 'from-amber-500 to-orange-600',
  },
};

export function IncentiveWidget() {
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const response = await fetch('/api/incentive/assign');
        if (response.ok) {
          const data = await response.json();
          setAssignment(data.assignment);
        }
      } catch {
        // Silently fail — widget is optional
      } finally {
        setLoading(false);
      }
    }
    fetchAssignment();
  }, []);

  if (loading) {
    return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (assignment) {
    const info = systemInfo[assignment.system];
    return (
      <Link href={info.href}>
        <Card className={`p-4 bg-gradient-to-r ${info.color} text-white cursor-pointer hover:shadow-lg transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wider">Active Challenge</p>
              <h3 className="font-bold text-lg">{info.name}</h3>
            </div>
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </Link>
    );
  }

  // Not assigned — show CTA
  return (
    <Link href="/dashboard/incentives">
      <Card className="p-4 border-dashed border-2 border-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-indigo-900">Choose Your Challenge System</h3>
            <p className="text-sm text-indigo-600">
              Pick from Daily Quests, Group Ladders, or Ambition Tracker
            </p>
          </div>
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
