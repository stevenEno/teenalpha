'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface MessageBadgeProps {
  count: number;
}

export function MessageBadge({ count }: MessageBadgeProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
