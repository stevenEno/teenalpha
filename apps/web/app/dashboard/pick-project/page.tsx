'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InterestCapture } from '@/components/explore/InterestCapture';
import { MindMapContainer } from '@/components/explore/MindMap';
import { PathDetailCard } from '@/components/explore/PathDetailCard';
import { useExplorePaths } from '@/hooks';

type Stage = 'interest' | 'paths';

export default function PickProjectPage() {
  const router = useRouter();
  const {
    paths,
    interest,
    selectedPathIndex,
    isGenerating,
    isLoadingDetails,
    isSyncing,
    error,
    generatePaths,
    loadPathDetails,
    selectPath,
    syncToAccount,
    getSelectedPath,
    hasPathDetails,
    reset,
  } = useExplorePaths();

  const [stage, setStage] = useState<Stage>('interest');
  const [showDetail, setShowDetail] = useState(false);
  const [sprintEnrollmentId, setSprintEnrollmentId] = useState<string | null>(null);

  // Fetch the teen's active sprint enrollment (if any) so we can redirect
  // back to /dashboard/sprint/[id] after saving the chosen project.
  useEffect(() => {
    fetch('/api/sprints/enrollment')
      .then((res) => res.ok ? res.json() : { enrollments: [] })
      .then((data) => {
        const active = (data.enrollments || []).find(
          (e: { status: string }) =>
            e.status === 'enrolled' || e.status === 'active'
        );
        if (active) setSprintEnrollmentId(active.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (interest && paths && paths.length > 0) setStage('paths');
  }, [interest, paths]);

  const handleInterestSubmit = async (submittedInterest: string) => {
    const success = await generatePaths(submittedInterest);
    if (success) setStage('paths');
  };

  const handlePathSelect = async (index: number) => {
    selectPath(index);
    setShowDetail(true);
    if (!hasPathDetails(index)) loadPathDetails(index);
  };

  // Authed-user version of "Choose this path": sync to DB + redirect.
  // sync-guest creates the project, backfills sprint_enrollments.project_title,
  // and awards onboarding Alpha.
  const handleChoosePath = async () => {
    const result = await syncToAccount();
    if (!result) return;
    setShowDetail(false);
    if (sprintEnrollmentId) {
      router.push(`/dashboard/sprint/${sprintEnrollmentId}`);
    } else {
      router.push(`/projects/${result.projectId}`);
    }
  };

  const handleRetry = () => {
    if (interest) generatePaths(interest);
  };

  const handleBack = () => {
    reset();
    setStage('interest');
    setShowDetail(false);
  };

  if (stage === 'interest') {
    return (
      <div className="relative">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <Link href={sprintEnrollmentId ? `/dashboard/sprint/${sprintEnrollmentId}` : '/dashboard'}>
            <button className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
        </div>
        <InterestCapture onSubmit={handleInterestSubmit} isLoading={isGenerating} />
        <AnimatePresence>
          {error && (
            <motion.div
              className="fixed bottom-6 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <p className="text-red-700 text-sm mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Start Over</span>
          </button>
          {interest && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Your Interest</span>
              <p className="font-semibold text-foreground">{interest}</p>
            </div>
          )}
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-red-700 text-sm mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isGenerating && paths && paths.length > 0 && (
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Pick your Sprint project
            </h1>
            <p className="text-muted-foreground">
              Five ways to turn <span className="font-semibold text-[#FF6B35]">{interest}</span> into real money.
              {' '}Tap one to dig in.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MindMapContainer
            interest={interest || ''}
            paths={paths || []}
            selectedPathIndex={selectedPathIndex}
            onSelectPath={handlePathSelect}
            isGenerating={isGenerating}
          />
        </motion.div>
      </main>

      <PathDetailCard
        path={getSelectedPath()}
        isOpen={showDetail}
        isLoadingDetails={isLoadingDetails === selectedPathIndex}
        onClose={() => setShowDetail(false)}
        onSelect={handleChoosePath}
        pathIndex={selectedPathIndex || 0}
      />

      {/* Syncing overlay while sync-guest runs */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
              <span className="text-foreground font-medium">Saving your project…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
