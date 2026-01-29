'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@teen-alpha/database';
import { MobileButton, MobileInput, MobileLayout } from '@/components/mobile';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Redirect to mobile entry which will determine next step
      router.push('/m');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && password.length >= 1;

  return (
    <MobileLayout
      footer={
        <MobileButton
          type="submit"
          form="login-form"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isFormValid}
          icon={<ArrowRight className="w-5 h-5" />}
        >
          Sign In
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
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue your journey
          </p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <MobileInput
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <MobileInput
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </form>

        {/* Links */}
        <div className="mt-8 space-y-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/m/signup" className="text-indigo-600 font-semibold">
              Sign up
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="block text-sm text-gray-500"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}
