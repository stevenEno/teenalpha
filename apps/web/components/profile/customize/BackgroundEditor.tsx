'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

const OVERLAYS: { key: ProfileCustomization['bg_overlay']; label: string; premium: boolean }[] = [
  { key: 'none', label: 'None', premium: false },
  { key: 'glitter', label: 'Glitter', premium: true },
  { key: 'stars', label: 'Stars', premium: true },
  { key: 'bubbles', label: 'Bubbles', premium: false },
];

interface BackgroundEditorProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
  onUpload: (file: File, type: 'background') => Promise<{ path: string; url: string }>;
  uploading: boolean;
  hasUnlock: (type: string, key: string) => boolean;
  onRequestUnlock: (type: string, key: string) => void;
}

export function BackgroundEditor({ customization, onUpdate, onUpload, uploading, hasUnlock, onRequestUnlock }: BackgroundEditorProps) {
  const [colorInput, setColorInput] = useState(customization?.bg_color || '#ffffff');
  const fileRef = useRef<HTMLInputElement>(null);
  const bgType = customization?.bg_type || 'default';

  const selectType = async (type: ProfileCustomization['bg_type']) => {
    await onUpdate({ bg_type: type });
  };

  const handleColorChange = async (value: string) => {
    setColorInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      await onUpdate({ bg_type: 'color', bg_color: value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onUpload(file, 'background');
    await onUpdate({ bg_type: 'upload', bg_image_path: result.path });
  };

  const toggleTile = async () => {
    await onUpdate({ bg_tile: !customization?.bg_tile });
  };

  const selectOverlay = async (overlay: ProfileCustomization['bg_overlay'], premium: boolean) => {
    if (premium && !hasUnlock('bg_overlay', overlay)) {
      onRequestUnlock('bg_overlay', overlay);
      return;
    }
    await onUpdate({ bg_overlay: overlay });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Background</h3>

      {/* Type Toggle */}
      <div className="flex gap-2">
        {(['default', 'color', 'upload'] as const).map(type => (
          <Button
            key={type}
            variant={bgType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => selectType(type)}
          >
            {type === 'default' ? 'Default' : type === 'color' ? 'Color' : 'Image'}
          </Button>
        ))}
      </div>

      {/* Color Picker */}
      {bgType === 'color' && (
        <div className="flex items-center gap-2">
          <Input
            value={colorInput}
            onChange={e => handleColorChange(e.target.value)}
            placeholder="#ffffff"
            className="w-32 font-mono text-sm"
          />
          <div className="w-8 h-8 rounded border" style={{ backgroundColor: colorInput }} />
        </div>
      )}

      {/* Image Upload */}
      {bgType === 'upload' && (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Choose Background Image'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={customization?.bg_tile || false}
              onChange={toggleTile}
              className="rounded"
            />
            <span className="text-sm">Tile image</span>
          </label>
        </div>
      )}

      {/* Overlay */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Overlay Effect</h4>
        <div className="grid grid-cols-2 gap-2">
          {OVERLAYS.map(overlay => (
            <button
              key={overlay.key}
              onClick={() => selectOverlay(overlay.key, overlay.premium)}
              className={`px-4 py-2 rounded-lg border-2 text-sm flex items-center justify-between transition-all ${
                customization?.bg_overlay === overlay.key
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span>{overlay.label}</span>
              {overlay.premium && !hasUnlock('bg_overlay', overlay.key) && (
                <Lock className="w-3 h-3 text-amber-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
