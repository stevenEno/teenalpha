'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, User, Image, FileText, Palette, Layers, Music, LayoutGrid, Sliders } from 'lucide-react';
import { useProfileCustomization } from '@/hooks/useProfileCustomization';
import { useAlphaBalance } from '@/hooks/useAlphaBalance';
import { useProfileUpload } from '@/hooks/useProfileUpload';
import { AvatarEditor } from '@/components/profile/customize/AvatarEditor';
import { BannerEditor } from '@/components/profile/customize/BannerEditor';
import { BioEditor } from '@/components/profile/customize/BioEditor';
import { ThemePicker } from '@/components/profile/customize/ThemePicker';
import { BackgroundEditor } from '@/components/profile/customize/BackgroundEditor';
import { MusicPlayer } from '@/components/profile/customize/MusicPlayer';
import { WidgetGallery } from '@/components/profile/customize/WidgetGallery';
import { CssSandbox } from '@/components/profile/customize/CssSandbox';
import { ProfilePreview } from '@/components/profile/customize/ProfilePreview';
import { UnlockModal } from '@/components/profile/customize/UnlockModal';
import type { ProfileCustomization } from '@teen-alpha/database';

const TABS = [
  { key: 'avatar', label: 'Avatar', icon: <User className="w-4 h-4" /> },
  { key: 'banner', label: 'Banner', icon: <Image className="w-4 h-4" /> },
  { key: 'bio', label: 'Bio', icon: <FileText className="w-4 h-4" /> },
  { key: 'theme', label: 'Theme', icon: <Palette className="w-4 h-4" /> },
  { key: 'background', label: 'Background', icon: <Layers className="w-4 h-4" /> },
  { key: 'music', label: 'Music', icon: <Music className="w-4 h-4" /> },
  { key: 'widgets', label: 'Widgets', icon: <LayoutGrid className="w-4 h-4" /> },
  { key: 'advanced', label: 'Advanced', icon: <Sliders className="w-4 h-4" /> },
] as const;

type TabKey = typeof TABS[number]['key'];

interface ProfileCustomizeEditorProps {
  userId: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
}

export function ProfileCustomizeEditor({ userId, name, bio: initialBio, avatarUrl }: ProfileCustomizeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('avatar');
  const [bio, setBio] = useState(initialBio);
  const [unlockModal, setUnlockModal] = useState<{ type: string; key: string } | null>(null);

  const { customization, unlocks, loading, update, unlock, hasUnlock } = useProfileCustomization();
  const { available, level, rank, refetch: refetchBalance } = useAlphaBalance();
  const { upload, uploading } = useProfileUpload();

  const handleUpdate = useCallback(async (partial: Partial<ProfileCustomization>) => {
    await update(partial);
  }, [update]);

  const handleUpload = useCallback(async (file: File, type: 'avatar' | 'banner' | 'background') => {
    return await upload(file, type);
  }, [upload]);

  const handleBioChange = useCallback((newBio: string) => {
    setBio(newBio);
    // Debounced save to profiles table
    const timeout = setTimeout(async () => {
      await fetch('/api/profile/customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // Also save bio to the profiles table directly
      await fetch('/api/profile/customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleRequestUnlock = useCallback((type: string, key: string) => {
    setUnlockModal({ type, key });
  }, []);

  const handleUnlock = useCallback(async (type: string, key: string) => {
    await unlock(type, key);
    await refetchBalance();
  }, [unlock, refetchBalance]);

  const unlockedBadges = unlocks
    .filter(u => u.unlock_type === 'badge_slot')
    .map(u => u.unlock_key);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customize Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Make it yours. Express yourself.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <div className="text-right">
              <p className="text-sm font-semibold text-indigo-600">{available} Alpha</p>
              <p className="text-xs text-gray-500">Lv{level} {rank}</p>
            </div>
          </div>
          <a
            href={`/profile/${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 underline"
          >
            View Profile
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main Editor Area */}
        <div>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white border border-b-white -mb-px text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'avatar' && (
                  <AvatarEditor
                    customization={customization}
                    onUpdate={handleUpdate}
                    onUpload={handleUpload}
                    uploading={uploading}
                    unlockedBadges={unlockedBadges}
                  />
                )}
                {activeTab === 'banner' && (
                  <BannerEditor
                    customization={customization}
                    onUpdate={handleUpdate}
                    onUpload={handleUpload}
                    uploading={uploading}
                  />
                )}
                {activeTab === 'bio' && (
                  <BioEditor
                    bio={bio}
                    onBioChange={handleBioChange}
                    customization={customization}
                    onUpdate={handleUpdate}
                  />
                )}
                {activeTab === 'theme' && (
                  <ThemePicker
                    customization={customization}
                    onUpdate={handleUpdate}
                    hasUnlock={hasUnlock}
                    onRequestUnlock={handleRequestUnlock}
                  />
                )}
                {activeTab === 'background' && (
                  <BackgroundEditor
                    customization={customization}
                    onUpdate={handleUpdate}
                    onUpload={handleUpload}
                    uploading={uploading}
                    hasUnlock={hasUnlock}
                    onRequestUnlock={handleRequestUnlock}
                  />
                )}
                {activeTab === 'music' && (
                  <MusicPlayer
                    customization={customization}
                    onUpdate={handleUpdate}
                  />
                )}
                {activeTab === 'widgets' && (
                  <WidgetGallery
                    customization={customization}
                    onUpdate={handleUpdate}
                    hasUnlock={hasUnlock}
                    onRequestUnlock={handleRequestUnlock}
                  />
                )}
                {activeTab === 'advanced' && (
                  <CssSandbox
                    customization={customization}
                    onUpdate={handleUpdate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Live Preview</h3>
            <ProfilePreview
              customization={customization}
              name={name}
              bio={bio}
              avatarUrl={avatarUrl}
            />
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {unlockModal && (
        <UnlockModal
          open={!!unlockModal}
          onClose={() => setUnlockModal(null)}
          unlockType={unlockModal.type}
          unlockKey={unlockModal.key}
          available={available}
          onUnlock={handleUnlock}
        />
      )}
    </main>
  );
}
