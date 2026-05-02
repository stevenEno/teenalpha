'use client';

import { useEffect, useState, useCallback } from 'react';
import { Flame, CheckCircle2, Camera, Rocket, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedEvent {
  id: string;
  actor_name: string;
  event_type: string;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
  is_self: boolean;
}

const EVENT_ICONS: Record<string, typeof CheckCircle2> = {
  pathway_complete: CheckCircle2,
  evidence_submitted: Camera,
  project_complete: Rocket,
  streak_milestone: Flame,
};

const EVENT_VERBS: Record<string, string> = {
  pathway_complete: 'completed',
  evidence_submitted: 'submitted evidence on',
  project_complete: 'finished project',
  streak_milestone: 'hit a streak milestone:',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (cursorVal: string | null) => {
    const params = new URLSearchParams({ limit: '20' });
    if (cursorVal) params.set('cursor', cursorVal);
    const res = await fetch(`/api/feed?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setEvents((prev) => (cursorVal ? [...prev, ...data.events] : data.events));
    setCursor(data.next_cursor);
    setHasMore(!!data.next_cursor);
    setLoading(false);
  }, []);

  useEffect(() => { load(null); }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-500">
        No activity yet. Complete a pathway step to be the first on the feed.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">What teens are building</h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {events.map((ev) => {
          const Icon = EVENT_ICONS[ev.event_type] ?? CheckCircle2;
          const verb = EVENT_VERBS[ev.event_type] ?? 'did';
          return (
            <li key={ev.id} className="px-5 py-3 flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 text-[#FF6B35] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{ev.is_self ? 'You' : ev.actor_name}</span>
                  {' '}{verb}{' '}
                  <span className="text-gray-600">{ev.title}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(ev.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <Button variant="ghost" size="sm" onClick={() => load(cursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
