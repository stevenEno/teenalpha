'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionsList } from '@/components/sessions/SessionsList';
import { BookSessionModal } from '@/components/sessions/BookSessionModal';
import { HourBalanceCard } from '@/components/payments/HourBalanceCard';
import Link from 'next/link';

interface HourBalance {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_avatar: string | null;
  teen_id: string;
  teen_name: string;
  balance_hours: number;
  total_purchased: number;
  total_used: number;
}

export default function SessionsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [balances, setBalances] = useState<HourBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<HourBalance | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [profileRes, balancesRes] = await Promise.all([
        fetch('/api/profile/social-data'),
        fetch('/api/hours/balance'),
      ]);

      if (!profileRes.ok) throw new Error('Failed to fetch profile');

      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      if (balancesRes.ok) {
        const balancesData = await balancesRes.json();
        setBalances(balancesData.balances || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBookSession(balance: HourBalance) {
    setSelectedBalance(balance);
    setShowBookingModal(true);
  }

  function handleSessionBooked() {
    setRefreshKey((prev) => prev + 1);
    fetchData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const userRole = profile?.role || 'parent';
  const totalBalance = balances.reduce((sum, b) => sum + b.balance_hours, 0);

  return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sessions</h1>
              <p className="text-gray-600">
                {userRole === 'mentor'
                  ? 'Manage your mentoring sessions'
                  : 'View and book mentoring sessions'}
              </p>
            </div>
            <div className="flex gap-2">
              {userRole === 'parent' && (
                <Link href="/dashboard/purchase">
                  <Button variant="outline">Purchase Hours</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="ghost">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Stats */}
          {userRole === 'parent' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Hours Available</h4>
                <p className="text-3xl font-bold text-green-600">{totalBalance}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Purchased</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {balances.reduce((sum, b) => sum + b.total_purchased, 0)}
                </p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Used</h4>
                <p className="text-3xl font-bold text-gray-600">
                  {balances.reduce((sum, b) => sum + b.total_used, 0)}
                </p>
              </Card>
            </div>
          )}

          {/* Book Session Cards (for parents with balance) */}
          {userRole === 'parent' && balances.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Book a New Session</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {balances
                  .filter((b) => b.balance_hours > 0)
                  .map((balance) => (
                    <HourBalanceCard
                      key={balance.id}
                      balance={balance}
                      onBookSession={() => handleBookSession(balance)}
                      onPurchaseMore={() => {
                        window.location.href = '/dashboard/purchase';
                      }}
                      compact
                    />
                  ))}
              </div>
              {balances.every((b) => b.balance_hours <= 0) && (
                <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-500">No hours available to book sessions.</p>
                    <Link href="/dashboard/purchase">
                      <Button className="mt-4">Purchase Hours</Button>
                    </Link>
                  </div>
                </Card>
              )}
            </section>
          )}

          {/* Sessions List */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
            <SessionsList key={refreshKey} userRole={userRole} />
          </section>

          {/* Empty-state guidance — no dead ends. Shows when the user has no
              balances (teen/parent) and is likely looking for how to book. */}
          {userRole !== 'mentor' && balances.length === 0 && (
            <Card className="p-6 bg-[#FF6B35]/5 border-[#FF6B35]/20">
              <h3 className="font-semibold text-foreground mb-2">
                How mentor sessions work
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 mb-4 list-disc pl-5">
                <li>
                  <span className="text-foreground font-medium">Sprint session:</span>{' '}
                  your 1 hour included with the First Dollar Sprint is booked
                  directly via the mentor's calendar link (shown on your sprint
                  dashboard).
                </li>
                <li>
                  <span className="text-foreground font-medium">Paid coaching:</span>{' '}
                  parents purchase mentor hours, then book sessions from here.
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
                {userRole === 'parent' && (
                  <Link href="/dashboard/purchase">
                    <Button className="bg-[#FF6B35] hover:bg-[#E85A24] text-white">
                      Purchase Mentor Hours
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
        {/* Booking Modal */}
        {selectedBalance && (
          <BookSessionModal
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedBalance(null);
            }}
            mentor={{
              id: selectedBalance.mentor_id,
              full_name: selectedBalance.mentor_name,
              avatar_url: selectedBalance.mentor_avatar,
            }}
            teen={{
              id: selectedBalance.teen_id,
              full_name: selectedBalance.teen_name,
            }}
            availableHours={selectedBalance.balance_hours}
            onSessionBooked={handleSessionBooked}
          />
        )}
      </main>
  );
}
