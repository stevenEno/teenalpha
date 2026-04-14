'use client';

import { MobileButton } from '@/components/mobile';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  profileName?: string | null;
  onContinue: () => void;
}

export function WelcomeStep({ profileName, onContinue }: WelcomeStepProps) {
  const firstName = profileName?.split(' ')[0] || 'there';

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-8">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome, {firstName}!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        Let's discover your unique path in just 2 minutes.
        We'll analyze what you're already interested in and show you
        career opportunities you'll actually care about.
      </p>

      {/* What we'll do */}
      <div className="bg-[#FF6B35]/5 rounded-2xl p-6 mb-8 text-left">
        <h3 className="font-semibold text-foreground mb-4">
          Here's what we'll do:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-[#FF6B35] mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-foreground">Get a couple quick details from you</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-[#FF6B35] mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-foreground">Analyze your social media to find your real interests</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-[#FF6B35] mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-foreground">Show you startup paths that match who you actually are</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <MobileButton
        fullWidth
        size="lg"
        onClick={onContinue}
        icon={<ArrowRight className="w-5 h-5" />}
      >
        Let's Go
      </MobileButton>
    </div>
  );
}
