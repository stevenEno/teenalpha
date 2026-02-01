'use client';

import { useState } from 'react';
import { Eye, Smile, Sparkles, Users } from 'lucide-react';
import type { ProfileWidget } from '@teen-alpha/database';

const MOOD_EMOJIS = ['😊', '😎', '🔥', '😴', '🤔', '😤', '🥳', '💜'];

interface WidgetRendererProps {
  widget: ProfileWidget;
  editable?: boolean;
  onUpdateConfig?: (config: Record<string, unknown>) => void;
}

export function WidgetRenderer({ widget, editable = false, onUpdateConfig }: WidgetRendererProps) {
  switch (widget.type) {
    case 'visitor_counter':
      return <VisitorCounterWidget count={(widget.config.count as number) || 0} />;
    case 'mood':
      return (
        <MoodWidget
          emoji={(widget.config.emoji as string) || '😊'}
          editable={editable}
          onSelect={(emoji) => onUpdateConfig?.({ emoji })}
        />
      );
    case 'glitter_text':
      return (
        <GlitterTextWidget
          text={(widget.config.text as string) || ''}
          editable={editable}
          onChange={(text) => onUpdateConfig?.({ text })}
        />
      );
    case 'top_friends':
      return <TopFriendsWidget friends={(widget.config.friends as string[]) || []} />;
    default:
      return null;
  }
}

function VisitorCounterWidget({ count }: { count: number }) {
  return (
    <div className="rounded-lg border p-3 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="w-4 h-4 text-indigo-500" />
        <span className="font-medium">{count.toLocaleString()}</span>
        <span className="text-gray-500">visitors</span>
      </div>
    </div>
  );
}

function MoodWidget({ emoji, editable, onSelect }: { emoji: string; editable: boolean; onSelect?: (emoji: string) => void }) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="rounded-lg border p-3 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <Smile className="w-4 h-4 text-amber-500" />
        <span className="text-sm text-gray-500">Mood:</span>
        <button
          onClick={() => editable && setPicking(!picking)}
          className={`text-2xl ${editable ? 'hover:scale-110 transition-transform cursor-pointer' : ''}`}
        >
          {emoji}
        </button>
      </div>
      {picking && editable && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {MOOD_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => { onSelect?.(e); setPicking(false); }}
              className="text-xl hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GlitterTextWidget({ text, editable, onChange }: { text: string; editable: boolean; onChange?: (text: string) => void }) {
  return (
    <div className="rounded-lg border p-3 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-sm text-gray-500">Glitter Text</span>
      </div>
      {editable ? (
        <input
          type="text"
          value={text}
          onChange={e => onChange?.(e.target.value)}
          placeholder="Type your glitter text..."
          maxLength={50}
          className="w-full text-sm border rounded px-2 py-1"
        />
      ) : (
        <p
          className="text-lg font-bold"
          style={{
            background: 'linear-gradient(90deg, #9333ea, #ec4899, #f97316, #9333ea)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}
        >
          {text || 'Sparkle!'}
        </p>
      )}
    </div>
  );
}

function TopFriendsWidget({ friends }: { friends: string[] }) {
  return (
    <div className="rounded-lg border p-3 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-500">Top Friends</span>
      </div>
      {friends.length > 0 ? (
        <div className="flex gap-2">
          {friends.slice(0, 4).map((friend, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
              {friend.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No friends added yet</p>
      )}
    </div>
  );
}
