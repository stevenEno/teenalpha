'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HourBalance {
  id: string;
  mentor_id: string;
  mentor_name: string;
  teen_id: string;
  teen_name: string;
  balance_hours: number;
}

interface HourBalanceWidgetProps {
  userRole: 'parent' | 'mentor' | 'teen';
}

export function HourBalanceWidget({ userRole }: HourBalanceWidgetProps) {
  const [balances, setBalances] = useState<HourBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  async function fetchBalances() {
    try {
      const response = await fetch('/api/hours/balance');
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalHours = balances.reduce((sum, b) => sum + b.balance_hours, 0);

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-10 bg-gray-200 rounded w-1/3" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {userRole === 'mentor' ? 'Client Hours' : 'Hour Balance'}
        </h3>
        {userRole === 'parent' ? (
          <Link href="/dashboard/purchase">
            <Button size="sm" variant="outline">Purchase</Button>
          </Link>
        ) : (
          <Link href="/dashboard/sessions">
            <Button size="sm" variant="outline">Sessions</Button>
          </Link>
        )}
      </div>

      {balances.length > 0 ? (
        <div className="space-y-2">
          <p className="text-3xl font-bold text-green-600">{totalHours} hrs</p>
          <p className="text-sm text-gray-500">
            {userRole === 'parent'
              ? `Across ${balances.length} mentor-teen pair${balances.length !== 1 ? 's' : ''}`
              : userRole === 'mentor'
              ? `From ${balances.length} famil${balances.length !== 1 ? 'ies' : 'y'}`
              : `Available for sessions`}
          </p>
          {userRole === 'parent' && totalHours < 3 && (
            <p className="text-xs text-orange-600">Running low - consider purchasing more</p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No hours purchased yet</p>
          {userRole === 'parent' && (
            <Link href="/dashboard/purchase">
              <Button size="sm" className="mt-2">
                Purchase Hours
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
