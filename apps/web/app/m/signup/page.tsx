'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@teen-alpha/database';
import { MobileButton, MobileInput, MobileLayout } from '@/components/mobile';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { trackEvent, trackExploreEvent } from '@/lib/ab-testing';
import { hasGuestExploreData, getGuestExploreData, clearGuestExploreData } from '@/lib/guest-storage';
import { ONBOARDING_ALPHA } from '@/lib/incentives';

export default function MobileSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExploreData, setHasExploreData] = useState(false);

  // Check for guest explore data on mount
  useEffect(() => {
    setHasExploreData(hasGuestExploreData());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Track signup started - always teen role for mobile
      trackEvent('signup_started', { role: 'teen', source: 'mobile' });

      await signUp(email, password, {
        full_name: fullName,
        role: 'teen', // Hardcoded for mobile teen app
      });

      // Track signup completed
      trackEvent('signup_completed', { role: 'teen', source: 'mobile' });

      // If user came from explore flow, sync their data
      if (hasGuestExploreData()) {
        try {
          const { interest, paths, selectedPathIndex, visitorId } = getGuestExploreData();

          if (interest && paths && selectedPathIndex !== null) {
            const syncResponse = await fetch('/api/explore/sync-guest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                interest,
                selectedPathIndex,
                paths,
                visitorId,
              }),
            });

            const syncResult = await syncResponse.json();

            if (syncResponse.ok && syncResult.success) {
              // Track successful sync
              trackExploreEvent('explore_signup_completed', {
                projectId: syncResult.projectId,
                alphaAwarded: syncResult.alphaAwarded,
              });

              // Clear guest data
              clearGuestExploreData();

              // Redirect to dashboard (project was already created)
              router.push('/dashboard');
              return;
            }
          }
        } catch (syncError) {
          console.error('Failed to sync explore data:', syncError);
          // Continue to normal onboarding if sync fails
        }
      }

      // Redirect to onboarding if no explore data
      router.push('/m/onboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = fullName.trim() && email.trim() && password.length >= 6;

  return (
    <MobileLayout
      footer={
        <MobileButton
          type="submit"
          form="signup-form"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isFormValid}
          icon={<ArrowRight className="w-5 h-5" />}
        >
          Create Account
        </MobileButton>
      }
    >
      <div className="px-6 pt-12 pb-32">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Teen Alpha
          </h1>
          <p className="text-gray-600">
            {hasExploreData
              ? 'Create your account to unlock your path'
              : 'Discover your path to building something amazing'}
          </p>
        </div>

        {/* Explore flow bonus indicator */}
        {hasExploreData && (
          <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-800 font-medium">
              +{ONBOARDING_ALPHA} Alpha bonus waiting for you!
            </span>
          </div>
        )}

        {/* Form */}
        <form id="signup-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <MobileInput
            label="Your Name"
            type="text"
            placeholder="What should we call you?"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <MobileInput
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div>
            <MobileInput
              label="Password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-2">
              At least 6 characters
            </p>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/m/login" className="text-indigo-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
