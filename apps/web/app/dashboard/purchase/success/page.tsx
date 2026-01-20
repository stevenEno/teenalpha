'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give the webhook a moment to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="max-w-md w-full p-8 text-center">
      {loading ? (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <h1 className="text-xl font-semibold">Processing your purchase...</h1>
          <p className="text-gray-500">Please wait while we confirm your payment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">
              Your mentoring hours have been added to your account.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              You can now book sessions with your mentor. Hours will be deducted when sessions are
              completed.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard/sessions">
              <Button className="w-full">Book a Session</Button>
            </Link>
            <Link href="/dashboard/purchase">
              <Button variant="outline" className="w-full">
                View Your Hours
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-400">
              Reference: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="max-w-md w-full p-8 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    </Card>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={<LoadingFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
