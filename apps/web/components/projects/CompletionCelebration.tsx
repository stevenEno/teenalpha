'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CompletionCelebrationProps {
  projectTitle: string;
  totalTasks: number;
}

export function CompletionCelebration({
  projectTitle,
  totalTasks,
}: CompletionCelebrationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Congratulations!
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          You've completed <strong>{projectTitle}</strong> with all {totalTasks}{' '}
          tasks done!
        </p>
        <div className="space-y-3">
          <Link href="/projects">
            <Button className="w-full" size="lg">
              View All Projects 🚀
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}