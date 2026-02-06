'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { trackExploreEvent, getQuestionVariantIndex, setQuestionVariantByIndex, QUESTION_VARIANTS } from '@/lib/ab-testing';

interface InterestCaptureProps {
  onSubmit: (interest: string) => void;
  isLoading?: boolean;
}

// A/B testable question variants
const questionVariants = [
  {
    id: 'curious',
    headline: "What are you excitedly curious about?",
    subtext: "That thing you'd research at 2am just because...",
    placeholder: "e.g., how engines work, why people believe things...",
    color: 'orange',
  },
  {
    id: 'youtube',
    headline: "What YouTube rabbit holes do you fall into?",
    subtext: "Those 3-hour deep dives nobody asked you to do",
    placeholder: "e.g., sneaker reselling, film editing, chess...",
    color: 'cyan',
  },
  {
    id: 'unprompted',
    headline: "What do you explore without being told to?",
    subtext: "No assignment. No grade. Just... you wanted to.",
    placeholder: "e.g., building PCs, making playlists, cooking...",
    color: 'lime',
  },
  {
    id: 'pain',
    headline: "What pain are you willing to endure?",
    subtext: "What's worth the struggle to get good at?",
    placeholder: "e.g., practicing guitar, learning to code, training...",
    color: 'pink',
  },
];

// Color schemes for each variant - bold, saturated colors
const colorSchemes: Record<string, { bg: string; accent: string; shape1: string; shape2: string; shape3: string }> = {
  orange: {
    bg: 'bg-amber-500',
    accent: 'bg-orange-600',
    shape1: 'bg-yellow-400',
    shape2: 'bg-red-500',
    shape3: 'bg-orange-300',
  },
  cyan: {
    bg: 'bg-cyan-500',
    accent: 'bg-blue-600',
    shape1: 'bg-teal-400',
    shape2: 'bg-indigo-500',
    shape3: 'bg-cyan-300',
  },
  lime: {
    bg: 'bg-lime-500',
    accent: 'bg-green-600',
    shape1: 'bg-yellow-400',
    shape2: 'bg-emerald-500',
    shape3: 'bg-lime-300',
  },
  pink: {
    bg: 'bg-pink-500',
    accent: 'bg-rose-600',
    shape1: 'bg-fuchsia-400',
    shape2: 'bg-purple-500',
    shape3: 'bg-pink-300',
  },
};

const exampleInterests = [
  'gaming',
  'drawing',
  'music',
  'sports',
  'coding',
  'cooking',
  'fashion',
  'photography',
];

// Use centralized A/B testing for question variant assignment

export function InterestCapture({ onSubmit, isLoading = false }: InterestCaptureProps) {
  const [interest, setInterest] = useState('');
  const [showExamples, setShowExamples] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentVariant = questionVariants[variantIndex];
  const colors = colorSchemes[currentVariant.color];

  // Initialize variant on mount using centralized A/B testing
  useEffect(() => {
    setIsMounted(true);
    setVariantIndex(getQuestionVariantIndex());
  }, []);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interest.trim() && !isLoading) {
      // Track which question variant was used
      trackExploreEvent('interest_submitted', {
        questionVariant: currentVariant.id,
        interest: interest.trim(),
      });
      onSubmit(interest.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setInterest(example);
    setShowExamples(false);
    trackExploreEvent('interest_submitted', {
      questionVariant: currentVariant.id,
      interest: example,
      fromExample: true,
    });
    setTimeout(() => {
      onSubmit(example);
    }, 100);
  };

  // Allow cycling through questions (for user exploration, also useful for testing)
  const cycleQuestion = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next'
      ? (variantIndex + 1) % questionVariants.length
      : (variantIndex - 1 + questionVariants.length) % questionVariants.length;
    setVariantIndex(newIndex);
    setQuestionVariantByIndex(newIndex);
  };

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden transition-colors duration-500`}>
      {/* Bold geometric shapes - inspired by crypto illustration style */}
      {isMounted && (
        <>
          {/* Large circle top-left */}
          <motion.div
            className={`absolute -top-32 -left-32 w-96 h-96 ${colors.shape1} rounded-full opacity-60`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 1.2 }}
          />

          {/* Triangle shape */}
          <motion.div
            className={`absolute top-20 right-10 w-0 h-0 border-l-[80px] border-l-transparent border-b-[140px] ${colors.shape2} border-r-[80px] border-r-transparent opacity-50`}
            style={{ borderBottomColor: 'currentColor' }}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 0.5 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className={`absolute -left-20 top-0 w-0 h-0 border-l-[80px] border-l-transparent border-b-[140px] border-r-[80px] border-r-transparent`}
              style={{ borderBottomColor: colors.shape2.replace('bg-', '') }}
            />
          </motion.div>

          {/* Small circles scattered */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${i % 2 === 0 ? colors.shape3 : colors.shape2} opacity-40`}
              style={{
                width: 20 + Math.random() * 60,
                height: 20 + Math.random() * 60,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
            />
          ))}

          {/* Large circle bottom-right */}
          <motion.div
            className={`absolute -bottom-48 -right-48 w-[500px] h-[500px] ${colors.accent} rounded-full opacity-40`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', duration: 1.5 }}
          />

          {/* Rectangular accent */}
          <motion.div
            className={`absolute bottom-32 left-10 w-8 h-32 ${colors.shape1} rounded-lg opacity-70 rotate-12`}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 0.7 }}
            transition={{ delay: 0.6 }}
          />
        </>
      )}

      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Question navigation */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => cycleQuestion('prev')}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex gap-1.5">
            {questionVariants.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === variantIndex ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => cycleQuestion('next')}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            aria-label="Next question"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </motion.div>

        {/* Headline - with animation on change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVariant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              {currentVariant.headline}
            </h1>
            <p className="text-white/80 text-lg mb-8 font-medium">
              {currentVariant.subtext}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Input Form - bold white card */}
        <motion.form
          onSubmit={handleSubmit}
          className="relative mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={interest}
              onChange={(e) => {
                setInterest(e.target.value);
                setShowExamples(e.target.value.length === 0);
              }}
              placeholder={currentVariant.placeholder}
              className="w-full px-6 py-5 pr-16 text-lg rounded-2xl bg-white text-gray-900 placeholder-gray-400 shadow-2xl border-4 border-black/10 focus:border-black/20 focus:outline-none transition-all font-medium"
              disabled={isLoading}
              maxLength={100}
            />
            <button
              type="submit"
              disabled={!interest.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 ${colors.accent} rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg`}
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <ArrowRight className="w-6 h-6" />
              )}
            </button>
          </div>
        </motion.form>

        {/* Quick picks - bold pill buttons */}
        {showExamples && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-white/70 text-sm mb-3 font-semibold uppercase tracking-wide">
              Quick picks
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {exampleInterests.map((example, index) => (
                <motion.button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-bold transition-all border-2 border-white/20 hover:border-white/40"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Alpha reward - bold card style */}
        <motion.div
          className="mt-10 inline-flex items-center gap-2 bg-black/20 rounded-full px-5 py-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="text-white font-bold">+50 Alpha waiting for you</span>
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="mt-4 text-white/50 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          We'll show you 5 ways to turn this into your first dollar online
        </motion.p>
      </motion.div>
    </div>
  );
}
