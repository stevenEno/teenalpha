'use client';

import { useEffect, useState } from 'react';
import { MobileButton } from '@/components/mobile';
import { CheckCircle, Rocket, ArrowRight } from 'lucide-react';

interface AnalyzingStepProps {
  onComplete: () => void;
}

export function AnalyzingStep({ onComplete }: AnalyzingStepProps) {
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    // Show completion state after a brief delay
    const timer = setTimeout(() => {
      setShowComplete(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!showComplete) {
    // Loading state
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-4 border-[#FF6B35]/20" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Analyzing your interests...
        </h2>
        <p className="text-gray-600">
          Discovering what makes you unique
        </p>
      </div>
    );
  }

  // Complete state
  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        You're all set!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        We've analyzed your data and found your unique interests.
        Now let's discover the startup paths that match who you really are.
      </p>

      {/* CTA Card */}
      <div className="bg-[#FF6B35]/5 rounded-2xl p-6 mb-8">
        <Rocket className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Startup Pathways Await
        </h3>
        <p className="text-gray-600 text-sm">
          See AI-generated career paths connecting your interests to real
          startup opportunities. Choose one and start building your portfolio today.
        </p>
      </div>

      {/* CTA Button */}
      <MobileButton
        fullWidth
        size="lg"
        onClick={onComplete}
        className="bg-[#FF6B35]"
        icon={<ArrowRight className="w-5 h-5" />}
      >
        Discover My Pathways
      </MobileButton>
    </div>
  );
}
