'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HourBalanceList } from '@/components/payments/HourBalanceCard';
import { PurchaseHoursModal } from '@/components/payments/PurchaseHoursModal';
import { BookSessionModal } from '@/components/sessions/BookSessionModal';
import Link from 'next/link';

function CancelledAlert() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled') === 'true';

  if (!cancelled) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-700">
        Your purchase was cancelled. No charges were made.
      </p>
    </div>
  );
}

interface Teen {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Connection {
  id: string;
  teen: Teen;
  verified: boolean;
}

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

export default function PurchasePage() {
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [balances, setBalances] = useState<HourBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedTeen, setSelectedTeen] = useState<Teen | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<HourBalance | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch profile, connections, and balances in parallel
      const [profileRes, connectionsRes, balancesRes] = await Promise.all([
        fetch('/api/profile/social-data'),
        fetch('/api/family/connections'),
        fetch('/api/hours/balance'),
      ]);

      if (!profileRes.ok) throw new Error('Failed to fetch profile');

      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.connections?.filter((c: Connection) => c.verified) || []);
      }

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

  function handlePurchaseHours(teen: Teen) {
    // For now, use Steven Eno as the default mentor
    // In production, you'd let the user select from available mentors
    setSelectedTeen(teen);
    // We need to get the default mentor ID - for now, we'll fetch it from an existing balance or mentorship
    fetchDefaultMentor(teen.id);
  }

  async function fetchDefaultMentor(teenId: string) {
    try {
      // Try to find from existing balance first
      const existingBalance = balances.find((b) => b.teen_id === teenId);
      if (existingBalance) {
        setSelectedMentorId(existingBalance.mentor_id);
        setShowPurchaseModal(true);
        return;
      }

      // Fetch the teen's mentors
      const response = await fetch(`/api/teen/${teenId}/mentors`);
      if (response.ok) {
        const data = await response.json();
        if (data.mentors && data.mentors.length > 0) {
          // Prefer the default mentor, otherwise use the first one
          const defaultMentor = data.mentors.find((m: any) => m.is_default_mentor);
          const mentor = defaultMentor || data.mentors[0];
          setSelectedMentorId(mentor.id);
          setShowPurchaseModal(true);
          return;
        }
      }

      // No mentor found
      setError('No mentor assigned to this teen yet. Please contact support.');
    } catch (err) {
      console.error('Error fetching mentor:', err);
      setError('Failed to load mentor information. Please try again.');
    }
  }

  function handleBookSession(mentorId: string, teenId: string) {
    const balance = balances.find((b) => b.mentor_id === mentorId && b.teen_id === teenId);
    if (balance) {
      setSelectedBalance(balance);
      setSelectedMentorId(mentorId);
      const teen = connections.find((c) => c.teen.id === teenId)?.teen;
      if (teen) {
        setSelectedTeen(teen);
        setShowBookingModal(true);
      }
    }
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

  const verifiedTeens = connections.filter((c) => c.verified);
  const userRole = profile?.role;

  // Only parents can purchase hours
  if (userRole && userRole !== 'parent') {
    return (
      <div className="min-h-screen bg-background">
        {profile && <Header profile={profile} />}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">
              {userRole === 'mentor'
                ? 'As a mentor, you receive hours when parents purchase them for sessions with their teens.'
                : 'Only parents can purchase mentoring hours.'}
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {profile && <Header profile={profile} />}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Purchase Mentoring Hours</h1>
              <p className="text-gray-600">Buy hours to book sessions with mentors</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Cancelled Alert */}
          <Suspense fallback={null}>
            <CancelledAlert />
          </Suspense>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Hour Balances */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Hour Balances</h2>
            <HourBalanceList
              balances={balances}
              onPurchaseMore={(mentorId, teenId) => {
                setSelectedMentorId(mentorId);
                const teen = connections.find((c) => c.teen.id === teenId)?.teen;
                if (teen) {
                  setSelectedTeen(teen);
                  setShowPurchaseModal(true);
                }
              }}
              onBookSession={handleBookSession}
              emptyMessage="No hour balances yet. Purchase hours for your teens below."
            />
          </section>

          {/* Purchase for Teens */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Purchase Hours for Your Teens</h2>
            {verifiedTeens.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {verifiedTeens.map((connection) => {
                  const teenBalances = balances.filter((b) => b.teen_id === connection.teen.id);
                  const totalHours = teenBalances.reduce((sum, b) => sum + b.balance_hours, 0);

                  return (
                    <Card key={connection.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {connection.teen.avatar_url ? (
                            <img
                              src={connection.teen.avatar_url}
                              alt={connection.teen.full_name || 'Teen'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            (connection.teen.full_name || '?')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {connection.teen.full_name || 'Teen'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {totalHours > 0
                              ? `${totalHours} hour${totalHours !== 1 ? 's' : ''} available`
                              : 'No hours purchased yet'}
                          </p>
                        </div>
                        <Button onClick={() => handlePurchaseHours(connection.teen)}>
                          Purchase Hours
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-500">No connected teens found.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Connect with your teen first to purchase hours.
                  </p>
                  <Link href="/dashboard">
                    <Button className="mt-4">Go to Dashboard</Button>
                  </Link>
                </div>
              </Card>
            )}
          </section>

          {/* View Sessions Link */}
          <div className="text-center pt-4">
            <Link href="/dashboard/sessions">
              <Button variant="outline">View All Sessions</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Purchase Modal */}
      {selectedTeen && selectedMentorId && (
        <PurchaseHoursModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedTeen(null);
            setSelectedMentorId(null);
          }}
          mentorId={selectedMentorId}
          teen={selectedTeen}
          onPurchaseComplete={fetchData}
        />
      )}

      {/* Booking Modal */}
      {selectedTeen && selectedMentorId && selectedBalance && (
        <BookSessionModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTeen(null);
            setSelectedMentorId(null);
            setSelectedBalance(null);
          }}
          mentor={{
            id: selectedMentorId,
            full_name: selectedBalance.mentor_name,
            avatar_url: selectedBalance.mentor_avatar,
          }}
          teen={selectedTeen}
          availableHours={selectedBalance.balance_hours}
          onSessionBooked={fetchData}
        />
      )}
    </div>
  );
}
