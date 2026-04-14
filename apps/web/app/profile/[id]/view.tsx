'use client';

import { User, Zap, ArrowLeft, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlitterOverlay } from '@/components/profile/customize/GlitterOverlay';
import { WidgetRenderer } from '@/components/profile/customize/WidgetRenderer';
import { MusicPlayerEmbed } from '@/components/profile/customize/MusicPlayer';
import type { ProfileCustomization, ProfileCssOverrides } from '@teen-alpha/database';

const PALETTES = {
  indigo:  { primary: '#6366f1', secondary: '#818cf8', bg: '#eef2ff', text: '#312e81' },
  teal:    { primary: '#14b8a6', secondary: '#5eead4', bg: '#f0fdfa', text: '#134e4a' },
  orange:  { primary: '#f97316', secondary: '#fb923c', bg: '#fff7ed', text: '#7c2d12' },
  hotpink: { primary: '#ec4899', secondary: '#f472b6', bg: '#fdf2f8', text: '#831843' },
  neon:    { primary: '#22c55e', secondary: '#4ade80', bg: '#f0fdf4', text: '#14532d' },
  dark:    { primary: '#818cf8', secondary: '#a5b4fc', bg: '#0f0e1a', text: '#e2e8f0' },
} as const;

const FONT_FAMILIES: Record<string, string> = {
  'inter': 'Inter, sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  'poppins': 'Poppins, sans-serif',
  'jetbrains-mono': '"JetBrains Mono", monospace',
  'caveat': 'Caveat, cursive',
};

const PRESET_EMOJIS: Record<string, string> = {
  rocket: '🚀', flame: '🔥', star: '⭐', lightning: '⚡',
  diamond: '💎', crown: '👑', heart: '💜', ghost: '👻',
};

interface PublicProfileViewProps {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string;
  };
  customization: ProfileCustomization | null;
  isOwner: boolean;
  alphaLevel: number;
  alphaTotal: number;
}

export function PublicProfileView({ profile, customization, isOwner, alphaLevel, alphaTotal }: PublicProfileViewProps) {
  const palette = PALETTES[customization?.theme_palette || 'indigo'];
  const font = FONT_FAMILIES[customization?.theme_font || 'inter'];
  const overrides: ProfileCssOverrides = customization?.css_overrides || {};
  const borderRadius = overrides.borderRadius ?? 8;
  const cardOpacity = overrides.cardOpacity ?? 1.0;
  const headerHeight = overrides.headerHeight ?? 180;
  const shadowIntensity = overrides.shadowIntensity ?? 4;
  const isDark = customization?.theme_palette === 'dark';

  // Background styles
  const bgStyle: React.CSSProperties = {};
  if (customization?.bg_type === 'color' && customization.bg_color) {
    bgStyle.backgroundColor = customization.bg_color;
  } else if (customization?.bg_type === 'upload' && customization.bg_image_path) {
    bgStyle.backgroundImage = `url(${customization.bg_image_path})`;
    bgStyle.backgroundSize = customization.bg_tile ? 'auto' : 'cover';
    bgStyle.backgroundRepeat = customization.bg_tile ? 'repeat' : 'no-repeat';
    bgStyle.backgroundPosition = 'center';
  } else {
    bgStyle.backgroundColor = palette.bg;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        ...bgStyle,
        fontFamily: font,
        color: palette.text,
      }}
    >
      {/* Glitter/Stars/Bubbles Overlay */}
      {customization?.bg_overlay && customization.bg_overlay !== 'none' && (
        <GlitterOverlay type={customization.bg_overlay} />
      )}

      {/* Header Actions */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 pt-4 flex items-center justify-between">
        <a href="/dashboard" className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>
        <div className="flex items-center gap-2">
          {!isOwner && profile.role === 'teen' && (
            <a href={`/messages?start=${profile.id}`}>
              <Button size="sm" className="bg-[#FF6B35]/50 hover:bg-[#FF6B35] text-white">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
            </a>
          )}
          {isOwner && (
            <a href="/dashboard/profile/customize">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 py-6">
        <div
          className="overflow-hidden"
          style={{
            borderRadius,
            boxShadow: `0 ${shadowIntensity}px ${shadowIntensity * 3}px rgba(0,0,0,${isDark ? 0.4 : 0.12})`,
            opacity: cardOpacity,
          }}
        >
          {/* Banner */}
          <div
            style={{
              height: headerHeight,
              backgroundColor: customization?.banner_color || palette.primary,
              backgroundImage: customization?.banner_type === 'upload' && customization.banner_image_path
                ? `url(${customization.banner_image_path})`
                : `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Content Area */}
          <div
            className="relative px-6 pb-6"
            style={{
              backgroundColor: isDark ? '#1a1830' : '#ffffff',
            }}
          >
            {/* Avatar */}
            <div className="-mt-10 mb-4 flex items-end gap-4">
              {customization?.avatar_type === 'preset' && customization.avatar_preset ? (
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl shadow-lg"
                  style={{
                    backgroundColor: palette.secondary,
                    borderColor: isDark ? '#1a1830' : '#ffffff',
                  }}
                >
                  {PRESET_EMOJIS[customization.avatar_preset] || '👤'}
                </div>
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  className="w-20 h-20 rounded-full border-4 object-cover shadow-lg"
                  style={{ borderColor: isDark ? '#1a1830' : '#ffffff' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: palette.secondary,
                    borderColor: isDark ? '#1a1830' : '#ffffff',
                  }}
                >
                  <User className="w-10 h-10 text-white" />
                </div>
              )}

              {/* Name + Alpha */}
              <div className="flex-1 pb-1">
                <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: palette.primary + '20', color: palette.primary }}
                  >
                    <Zap className="w-3 h-3" />
                    <span className="font-medium">Lv{alphaLevel}</span>
                    <span className="opacity-70">{alphaTotal} Alpha</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {profile.bio}
              </p>
            )}

            {/* Interests */}
            {customization?.interests && customization.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customization.interests.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    style={{
                      backgroundColor: palette.primary + '15',
                      color: palette.primary,
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Widgets */}
            {customization?.widgets && customization.widgets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {customization.widgets.map((widget, i) => (
                  <WidgetRenderer key={i} widget={widget} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Music Player */}
      {customization?.music_url && (
        <MusicPlayerEmbed
          url={customization.music_url}
          autoplay={customization.music_autoplay}
        />
      )}

      {/* Shimmer animation for glitter text */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
