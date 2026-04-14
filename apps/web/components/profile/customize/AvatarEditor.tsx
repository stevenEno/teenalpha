'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, User, Image } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

const PRESET_AVATARS = [
  'rocket', 'flame', 'star', 'lightning',
  'diamond', 'crown', 'heart', 'ghost',
];

interface AvatarEditorProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
  onUpload: (file: File, type: 'avatar') => Promise<{ path: string; url: string }>;
  uploading: boolean;
  unlockedBadges: string[];
}

export function AvatarEditor({ customization, onUpdate, onUpload, uploading, unlockedBadges }: AvatarEditorProps) {
  const [tab, setTab] = useState<'upload' | 'preset'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const result = await onUpload(file, 'avatar');
    await onUpdate({ avatar_type: 'upload' });
    setPreview(result.url);
  };

  const selectPreset = async (preset: string) => {
    await onUpdate({ avatar_type: 'preset', avatar_preset: preset });
    setPreview(null);
  };

  const toggleBadge = async (badge: string) => {
    const current = customization?.avatar_badges || [];
    const updated = current.includes(badge)
      ? current.filter(b => b !== badge)
      : [...current, badge];
    await onUpdate({ avatar_badges: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Avatar</h3>
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('upload')}
          >
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
          <Button
            variant={tab === 'preset' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('preset')}
          >
            <Image className="w-4 h-4 mr-1" /> Presets
          </Button>
        </div>
      </div>

      {tab === 'upload' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#FF6B35]/60 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <User className="w-12 h-12" />
                <p className="text-sm">Click to upload avatar</p>
                <p className="text-xs text-gray-400">Max 5MB, image files only</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
        </div>
      )}

      {tab === 'preset' && (
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map(preset => (
            <button
              key={preset}
              onClick={() => selectPreset(preset)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                customization?.avatar_preset === preset
                  ? 'border-[#FF6B35] bg-[#FF6B35]/5 scale-110'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {preset === 'rocket' && '🚀'}
              {preset === 'flame' && '🔥'}
              {preset === 'star' && '⭐'}
              {preset === 'lightning' && '⚡'}
              {preset === 'diamond' && '💎'}
              {preset === 'crown' && '👑'}
              {preset === 'heart' && '💜'}
              {preset === 'ghost' && '👻'}
            </button>
          ))}
        </div>
      )}

      {unlockedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Badge Overlays</h4>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map(badge => (
              <Badge
                key={badge}
                variant={customization?.avatar_badges?.includes(badge) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleBadge(badge)}
              >
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
