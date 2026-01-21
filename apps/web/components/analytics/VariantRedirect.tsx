'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAssignedVariant } from '@/lib/ab-testing';

export function VariantRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Get or assign a random variant
    const variant = getAssignedVariant();
    // Redirect to the assigned variant's landing page
    router.replace(`/${variant}`);
  }, [router]);

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
