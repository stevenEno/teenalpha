'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { InterestCapture } from '@/components/explore/InterestCapture';
import { MindMapContainer } from '@/components/explore/MindMap';
import { PathDetailCard } from '@/components/explore/PathDetailCard';
import { SignupPrompt } from '@/components/explore/SignupPrompt';
import { useExplorePaths } from '@/hooks';
import { trackExploreEvent, getExploreVariant } from '@/lib/ab-testing';
import { getPathIcon } from '@/lib/path-icons';
import type { ExplorePathSummary } from '@teen-alpha/database';

type ExploreStage = 'interest' | 'paths' | 'detail' | 'signup';

export default function ExplorePage() {
  const {
    paths,
    interest,
    selectedPathIndex,
    isGenerating,
    isLoadingDetails,
    error,
    generatePaths,
    loadPathDetails,
    selectPath,
    getSelectedPath,
    hasPathDetails,
    reset,
  } = useExplorePaths();

  const [stage, setStage] = useState<ExploreStage>('interest');
  const [showDetail, setShowDetail] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [variant, setVariant] = useState<'mindmap' | 'list'>('mindmap');

  // Track page view and load variant once on mount
  useEffect(() => {
    trackExploreEvent('explore_view');
    setVariant(getExploreVariant());
  }, []);

  // Restore stage from localStorage when returning user has saved data
  useEffect(() => {
    if (interest && paths && paths.length > 0) {
      setStage('paths');
    }
  }, [interest, paths]);

  // Handle interest submission
  const handleInterestSubmit = async (submittedInterest: string) => {
    const success = await generatePaths(submittedInterest);
    if (success) {
      setStage('paths');
    }
  };

  // Handle path selection from mind map - trigger detail loading
  const handlePathSelect = async (index: number) => {
    selectPath(index);
    setShowDetail(true);

    // Load details if not already loaded
    if (!hasPathDetails(index)) {
      loadPathDetails(index);
    }
  };

  // Handle "Choose This Path" from detail card
  const handleChoosePath = () => {
    setShowDetail(false);
    setShowSignup(true);
    trackExploreEvent('signup_prompted', {
      pathIndex: selectedPathIndex,
      pathName: getSelectedPath()?.name,
    });
  };

  // Handle back to interest input
  const handleBack = () => {
    reset();
    setStage('interest');
    setShowDetail(false);
    setShowSignup(false);
  };

  // Handle retry on error
  const handleRetry = () => {
    if (interest) {
      generatePaths(interest);
    }
  };

  // Interest capture stage
  if (stage === 'interest') {
    return (
      <div className="relative">
        <InterestCapture onSubmit={handleInterestSubmit} isLoading={isGenerating} />

        {/* Error toast overlay — visible during interest stage */}
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

  // Mind map / paths stage
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Start Over</span>
          </button>

          {interest && (
            <div className="text-center">
              <span className="text-xs text-gray-500">Your Interest</span>
              <p className="font-semibold text-gray-900">{interest}</p>
            </div>
          )}

          <div className="w-24" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Error state */}
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

        {/* Introduction text */}
        {!isGenerating && paths && paths.length > 0 && (
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Paths to First Dollar
            </h1>
            <p className="text-gray-600">
              We found 5 ways you can turn <span className="font-semibold text-indigo-600">{interest}</span> into real money.
              {' '}Tap a path to learn more.
            </p>
          </motion.div>
        )}

        {/* Mind Map */}
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

        {/* Path list view (for list variant - alternative to mind map) */}
        {variant === 'list' && paths && paths.length > 0 && (
          <motion.div
            className="mt-6 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {paths.map((path, index) => (
              <button
                key={path.id || index}
                onClick={() => handlePathSelect(index)}
                className={`w-full text-left p-4 bg-white rounded-xl border-2 transition-all ${
                  selectedPathIndex === index
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center p-1.5">
                    <img
                      src={getPathIcon(path.name, path.tagline)}
                      alt={path.name}
                      className="w-9 h-9 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{path.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{path.tagline}</p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Tips below mind map */}
        {paths && paths.length > 0 && !isGenerating && (
          <motion.div
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { emoji: '💡', title: 'No cost to start', desc: 'All paths use free tools' },
              { emoji: '⏱️', title: '30 days or less', desc: 'See results fast' },
              { emoji: '🎯', title: 'Real money', desc: 'Earn your first dollar' },
            ].map((tip, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-100 text-center"
              >
                <span className="text-2xl mb-2 block">{tip.emoji}</span>
                <p className="font-medium text-gray-900 text-sm">{tip.title}</p>
                <p className="text-gray-500 text-xs">{tip.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Path Detail Card */}
      <PathDetailCard
        path={getSelectedPath()}
        isOpen={showDetail}
        isLoadingDetails={isLoadingDetails === selectedPathIndex}
        onClose={() => setShowDetail(false)}
        onSelect={handleChoosePath}
        pathIndex={selectedPathIndex || 0}
      />

      {/* Signup Prompt */}
      <SignupPrompt
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        selectedPath={getSelectedPath()}
        interest={interest}
      />
    </div>
  );
}
