'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

interface BioEditorProps {
  bio: string;
  onBioChange: (bio: string) => void;
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
}

export function BioEditor({ bio, onBioChange, customization, onUpdate }: BioEditorProps) {
  const [tagInput, setTagInput] = useState('');
  const interests = customization?.interests || [];

  const addInterest = async (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || interests.includes(trimmed)) return;
    if (interests.length >= 10) return;

    const updated = [...interests, trimmed];
    await onUpdate({ interests: updated });
    setTagInput('');
  };

  const removeInterest = async (tag: string) => {
    const updated = interests.filter(i => i !== tag);
    await onUpdate({ interests: updated });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest(tagInput);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bio & Interests</h3>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">About You</label>
        <Textarea
          value={bio}
          onChange={e => onBioChange(e.target.value)}
          placeholder="Tell people about yourself..."
          rows={4}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
      </div>

      {/* Interests */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Interests ({interests.length}/10)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an interest and press Enter"
            className="flex-1"
            disabled={interests.length >= 10}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
              onClick={() => removeInterest(tag)}
            >
              {tag}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {interests.length === 0 && (
            <p className="text-sm text-gray-400">No interests added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
