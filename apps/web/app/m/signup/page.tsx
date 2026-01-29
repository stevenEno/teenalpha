'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@teen-alpha/database';
import { MobileButton, MobileInput, MobileLayout } from '@/components/mobile';
import { Sparkles, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/ab-testing';

export default function MobileSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Track signup started - always teen role for mobile
      trackEvent('signup_started', undefined, { role: 'teen', source: 'mobile' });

      await signUp(email, password, {
        full_name: fullName,
        role: 'teen', // Hardcoded for mobile teen app
      });

      // Track signup completed
      trackEvent('signup_completed', undefined, { role: 'teen', source: 'mobile' });

      // Redirect to onboarding
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
            Discover your path to building something amazing
          </p>
        </div>

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
