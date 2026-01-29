'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({
  message = 'Loading...',
  subMessage
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-8">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-900 text-center">
        {message}
      </p>
      {subMessage && (
        <p className="text-sm text-gray-500 text-center mt-2">
          {subMessage}
        </p>
      )}
    </div>
  );
}
