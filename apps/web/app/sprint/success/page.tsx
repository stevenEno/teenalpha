'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SprintSuccessPage() {
  const searchParams = useSearchParams();
  const sprintId = searchParams.get('sprint_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </motion.div>

          <h1 className="text-3xl font-black mb-2">You&apos;re In!</h1>
          <p className="text-gray-400 text-lg mb-8">
            The First Dollar Sprint starts now. Your teen is enrolled and ready
            to build something amazing.
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              'Week 1: 1-on-1 mentor session to pick a project',
              'Week 2-3: Daily AI tasks to build it',
              'Week 4: Ship it and earn the first dollar',
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="flex items-start gap-3"
              >
                <Rocket className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                <span className="text-gray-300 text-sm">{step}</span>
              </motion.div>
            ))}
          </div>

          <Link href="/dashboard">
            <Button
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6 rounded-full"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <p className="text-gray-600 text-sm mt-4">
            Redirecting in {countdown}s...
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
