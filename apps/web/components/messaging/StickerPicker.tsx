'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StickerPickerProps {
  open: boolean;
  onSelect: (stickerKey: string) => void;
  onClose: () => void;
}

interface StickerCategory {
  label: string;
  stickers: { key: string; emoji: string; label: string }[];
}

const STICKER_CATEGORIES: StickerCategory[] = [
  {
    label: 'Reactions',
    stickers: [
      { key: 'fire', emoji: '🔥', label: 'Fire' },
      { key: 'heart', emoji: '❤️', label: 'Heart' },
      { key: 'laugh', emoji: '😂', label: 'Laugh' },
      { key: 'cool', emoji: '😎', label: 'Cool' },
      { key: 'wave', emoji: '👋', label: 'Wave' },
      { key: 'clap', emoji: '👏', label: 'Clap' },
      { key: 'thinking', emoji: '🤔', label: 'Thinking' },
      { key: 'party', emoji: '🎉', label: 'Party' },
    ],
  },
  {
    label: 'Motivation',
    stickers: [
      { key: 'rocket', emoji: '🚀', label: 'Rocket' },
      { key: 'star', emoji: '⭐', label: 'Star' },
      { key: 'brain', emoji: '🧠', label: 'Brain' },
      { key: 'flex', emoji: '💪', label: 'Flex' },
      { key: 'trophy', emoji: '🏆', label: 'Trophy' },
      { key: 'sparkle', emoji: '✨', label: 'Sparkle' },
      { key: 'check', emoji: '✅', label: 'Done' },
      { key: 'lightning', emoji: '⚡', label: 'Lightning' },
    ],
  },
];

export function StickerPicker({ open, onSelect, onClose }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10"
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        {/* Category tabs */}
        <div className="flex border-b border-gray-100 px-2 pt-2">
          {STICKER_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                activeCategory === i
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 px-2 text-xs"
          >
            Close
          </button>
        </div>

        {/* Sticker grid */}
        <div className="grid grid-cols-4 gap-1 p-2">
          {STICKER_CATEGORIES[activeCategory].stickers.map((sticker) => (
            <motion.button
              key={sticker.key}
              onClick={() => {
                onSelect(sticker.key);
                onClose();
              }}
              className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-2xl">{sticker.emoji}</span>
              <span className="text-[10px] text-gray-400">{sticker.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
