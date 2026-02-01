'use client';

import { User } from 'lucide-react';
import type { ProfileCustomization, ProfileCssOverrides } from '@teen-alpha/database';
import { PALETTES } from './ThemePicker';

const PRESET_EMOJIS: Record<string, string> = {
  rocket: '🚀', flame: '🔥', star: '⭐', lightning: '⚡',
  diamond: '💎', crown: '👑', heart: '💜', ghost: '👻',
};

interface ProfilePreviewProps {
  customization: ProfileCustomization | null;
  name: string;
  bio: string;
  avatarUrl?: string | null;
}

export function ProfilePreview({ customization, name, bio, avatarUrl }: ProfilePreviewProps) {
  const palette = PALETTES[customization?.theme_palette || 'indigo'];
  const overrides: ProfileCssOverrides = customization?.css_overrides || {};
  const borderRadius = overrides.borderRadius ?? 8;
  const cardOpacity = overrides.cardOpacity ?? 1.0;
  const headerHeight = overrides.headerHeight ?? 180;
  const shadowIntensity = overrides.shadowIntensity ?? 4;

  return (
    <div
      className="border rounded-lg overflow-hidden shadow-sm"
      style={{
        borderRadius,
        boxShadow: `0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0,0,0,0.1)`,
      }}
    >
      {/* Banner */}
      <div
        style={{
          height: Math.min(headerHeight, 120),
          backgroundColor: customization?.banner_color || palette.primary,
          backgroundImage: customization?.banner_type === 'upload' && customization.banner_image_path
            ? `url(${customization.banner_image_path})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div
        className="p-4 -mt-6 relative"
        style={{
          backgroundColor: palette.bg,
          opacity: cardOpacity,
        }}
      >
        {/* Avatar */}
        <div className="mb-3">
          {customization?.avatar_type === 'preset' && customization.avatar_preset ? (
            <div
              className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: palette.secondary }}
            >
              {PRESET_EMOJIS[customization.avatar_preset] || '👤'}
            </div>
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: palette.secondary }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Name + Bio */}
        <h4 className="font-semibold text-sm truncate" style={{ color: palette.primary }}>
          {name || 'Your Name'}
        </h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {bio || 'Your bio will appear here...'}
        </p>

        {/* Interest Tags */}
        {customization?.interests && customization.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {customization.interests.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: palette.secondary + '30', color: palette.primary }}
              >
                {tag}
              </span>
            ))}
            {customization.interests.length > 3 && (
              <span className="text-[10px] text-gray-400">+{customization.interests.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
