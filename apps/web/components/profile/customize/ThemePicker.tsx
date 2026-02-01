'use client';

import { Lock } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

export const PALETTES = {
  indigo:  { primary: '#6366f1', secondary: '#818cf8', bg: '#eef2ff' },
  teal:    { primary: '#14b8a6', secondary: '#5eead4', bg: '#f0fdfa' },
  orange:  { primary: '#f97316', secondary: '#fb923c', bg: '#fff7ed' },
  hotpink: { primary: '#ec4899', secondary: '#f472b6', bg: '#fdf2f8' },
  neon:    { primary: '#22c55e', secondary: '#4ade80', bg: '#f0fdf4' },
  dark:    { primary: '#1e1b4b', secondary: '#312e81', bg: '#0f0e1a' },
} as const;

const FONTS: { key: ProfileCustomization['theme_font']; label: string; premium: boolean }[] = [
  { key: 'inter', label: 'Inter', premium: false },
  { key: 'space-grotesk', label: 'Space Grotesk', premium: false },
  { key: 'poppins', label: 'Poppins', premium: false },
  { key: 'jetbrains-mono', label: 'JetBrains Mono', premium: true },
  { key: 'caveat', label: 'Caveat', premium: true },
];

const FONT_FAMILIES: Record<string, string> = {
  'inter': 'Inter, sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  'poppins': 'Poppins, sans-serif',
  'jetbrains-mono': '"JetBrains Mono", monospace',
  'caveat': 'Caveat, cursive',
};

interface ThemePickerProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
  hasUnlock: (type: string, key: string) => boolean;
  onRequestUnlock: (type: string, key: string) => void;
}

export function ThemePicker({ customization, onUpdate, hasUnlock, onRequestUnlock }: ThemePickerProps) {
  const selectPalette = async (palette: ProfileCustomization['theme_palette']) => {
    await onUpdate({ theme_palette: palette });
  };

  const selectFont = async (font: ProfileCustomization['theme_font'], premium: boolean) => {
    if (premium && !hasUnlock('font', font)) {
      onRequestUnlock('font', font);
      return;
    }
    await onUpdate({ theme_font: font });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Theme</h3>

      {/* Color Palettes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Color Palette</h4>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(PALETTES) as [keyof typeof PALETTES, typeof PALETTES[keyof typeof PALETTES]][]).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => selectPalette(key)}
              className={`rounded-lg p-3 border-2 transition-all ${
                customization?.theme_palette === key
                  ? 'border-gray-900 ring-2 ring-gray-900/20'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: palette.bg }}
            >
              <div className="flex gap-1 mb-1">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.primary }} />
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.secondary }} />
              </div>
              <p className="text-xs font-medium capitalize">{key}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Font</h4>
        <div className="space-y-2">
          {FONTS.map(font => (
            <button
              key={font.key}
              onClick={() => selectFont(font.key, font.premium)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                customization?.theme_font === font.key
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span style={{ fontFamily: FONT_FAMILIES[font.key] }} className="text-lg">
                {font.label}
              </span>
              {font.premium && !hasUnlock('font', font.key) && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Lock className="w-3 h-3" /> 100 Alpha
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
