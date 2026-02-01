'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, X, AlertCircle } from 'lucide-react';
import type { ProfileCustomization } from '@teen-alpha/database';

const MUSIC_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|open\.spotify\.com\/(track|playlist|album)\/)/;

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // YouTube
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Spotify
    if (parsed.hostname === 'open.spotify.com') {
      const pathParts = parsed.pathname.split('/');
      if (pathParts.length >= 3) {
        return `https://open.spotify.com/embed/${pathParts[1]}/${pathParts[2]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

interface MusicPlayerProps {
  customization: ProfileCustomization | null;
  onUpdate: (partial: Partial<ProfileCustomization>) => Promise<void>;
}

export function MusicPlayer({ customization, onUpdate }: MusicPlayerProps) {
  const [urlInput, setUrlInput] = useState(customization?.music_url || '');
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const handleSave = async () => {
    setError(null);

    if (!urlInput.trim()) {
      await onUpdate({ music_url: null });
      return;
    }

    if (!MUSIC_PATTERN.test(urlInput)) {
      setError('Only YouTube and Spotify URLs are supported');
      return;
    }

    const embedUrl = getEmbedUrl(urlInput);
    if (!embedUrl) {
      setError('Could not parse this URL');
      return;
    }

    await onUpdate({ music_url: urlInput });
  };

  const handleRemove = async () => {
    setUrlInput('');
    await onUpdate({ music_url: null });
  };

  const toggleAutoplay = async () => {
    await onUpdate({ music_autoplay: !customization?.music_autoplay });
  };

  const embedUrl = customization?.music_url ? getEmbedUrl(customization.music_url) : null;
  const isSpotify = customization?.music_url?.includes('spotify.com');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Music className="w-5 h-5" /> Music Player
      </h3>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="Paste YouTube or Spotify URL..."
            className="flex-1"
          />
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        <p className="text-xs text-gray-400">
          Supported: youtube.com, youtu.be, open.spotify.com
        </p>
      </div>

      {/* Autoplay Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={customization?.music_autoplay || false}
          onChange={toggleAutoplay}
          className="rounded"
        />
        <span className="text-sm">Autoplay (off by default)</span>
      </label>

      {/* Player Preview */}
      {embedUrl && (
        <div className="relative rounded-lg overflow-hidden border bg-gray-900">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
            <div className="flex items-center gap-2 text-white text-sm">
              <Music className="w-4 h-4" />
              <span>{isSpotify ? 'Spotify' : 'YouTube'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPlaying(!playing)}
                className="text-white hover:text-gray-300 p-1"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRemove}
                className="text-white hover:text-gray-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {playing && (
            <iframe
              src={embedUrl}
              width="100%"
              height={isSpotify ? 80 : 200}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="block"
            />
          )}
        </div>
      )}
    </div>
  );
}

// Standalone player for public profile view
export function MusicPlayerEmbed({ url, autoplay }: { url: string; autoplay: boolean }) {
  const embedUrl = getEmbedUrl(url);
  const isSpotify = url.includes('spotify.com');

  if (!embedUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-lg overflow-hidden shadow-lg border bg-gray-900">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm">
        <Music className="w-4 h-4" />
        <span>{isSpotify ? 'Spotify' : 'YouTube'}</span>
      </div>
      <iframe
        src={`${embedUrl}${autoplay ? '?autoplay=1' : ''}`}
        width="100%"
        height={isSpotify ? 80 : 200}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="block"
      />
    </div>
  );
}
