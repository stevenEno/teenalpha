'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Palette } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

const PRESET_COLORS = [
  '#6366f1', '#14b8a6', '#f97316',
  '#ec4899', '#22c55e', '#1e1b4b',
];

interface BannerEditorProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
  onUpload: (file: File, type: 'banner') => Promise<{ path: string; url: string }>;
  uploading: boolean;
}

export function BannerEditor({ customization, onUpdate, onUpload, uploading }: BannerEditorProps) {
  const [hexInput, setHexInput] = useState(customization?.banner_color || '#6366f1');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectColor = async (color: string) => {
    setHexInput(color);
    await onUpdate({ banner_type: 'color', banner_color: color });
  };

  const handleHexChange = async (value: string) => {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      await onUpdate({ banner_type: 'color', banner_color: value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await onUpload(file, 'banner');
    await onUpdate({ banner_type: 'upload', banner_image_path: result.path });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Banner</h3>

      {/* Preview */}
      <div
        className="w-full h-32 rounded-lg overflow-hidden relative"
        style={{
          backgroundColor: customization?.banner_color || '#6366f1',
          backgroundImage: customization?.banner_type === 'upload' && customization.banner_image_path
            ? `url(${customization.banner_image_path})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Color Swatches */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Palette className="w-4 h-4" /> Colors
        </h4>
        <div className="flex gap-3 mb-3">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => selectColor(color)}
              className={`w-10 h-10 rounded-full border-2 transition-transform ${
                customization?.banner_color === color && customization?.banner_type === 'color'
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={hexInput}
            onChange={e => handleHexChange(e.target.value)}
            placeholder="#6366f1"
            className="w-32 font-mono text-sm"
          />
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: hexInput }}
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Upload className="w-4 h-4" /> Upload Banner Image
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Choose Image'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
