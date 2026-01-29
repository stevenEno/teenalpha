'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MobileLayout, MobileButton } from '@/components/mobile';
import { CheckCircle, Rocket, ArrowRight, Sparkles } from 'lucide-react';

export default function PathwayChosenPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const pathwayName = searchParams.get('name') || 'Your Pathway';

  return (
    <MobileLayout>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center justify-center min-h-[80vh] text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-yellow-800" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          You're on your way!
        </h1>

        {/* Pathway Name */}
        <div className="bg-indigo-50 rounded-xl px-4 py-2 mb-4">
          <p className="text-indigo-700 font-medium">
            {decodeURIComponent(pathwayName)}
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8 max-w-sm">
          We've created your project with tasks to get you started.
          Your entrepreneurial journey begins now!
        </p>

        {/* What's Next Card */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 w-full max-w-sm text-left">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-indigo-600" />
            What's next?
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">1.</span>
              <span>Check out your new project with tasks</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">2.</span>
              <span>Complete your first task today</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-indigo-600 mr-2">3.</span>
              <span>Connect with a mentor for guidance</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm space-y-3">
          {projectId && (
            <Link href={`/projects/${projectId}`} className="block">
              <MobileButton
                fullWidth
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                View My Project
              </MobileButton>
            </Link>
          )}

          <Link href="/dashboard" className="block">
            <MobileButton
              fullWidth
              variant="secondary"
            >
              Go to Dashboard
            </MobileButton>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}
