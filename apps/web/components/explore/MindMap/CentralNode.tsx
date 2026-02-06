'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CentralNodeProps {
  interest: string;
  isAnimating?: boolean;
}

export function CentralNode({ interest, isAnimating = false }: CentralNodeProps) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      <motion.div
        className="relative"
        animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-xl opacity-50 scale-125" />

        {/* Main node */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white">
          <Sparkles className="w-6 h-6 text-white/80 mb-1" />
          <span className="text-white font-bold text-sm sm:text-base text-center px-3 leading-tight">
            {interest.length > 20 ? interest.slice(0, 20) + '...' : interest}
          </span>
        </div>

        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-300"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
