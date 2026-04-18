'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  parent_name: string;
  parent_email: string;
  teen_name: string;
  teen_curiosity: string | null;
  teen_self_starter: string | null;
  cohort: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ['new', 'contacted', 'accepted', 'declined', 'enrolled'] as const;

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  enrolled: 'bg-purple-100 text-purple-800',
};

export function CohortReview({ initialApplications }: { initialApplications: Application[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApplications);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);

  const counts = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/cohort/update', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({apps.length})
        </Button>
        {STATUS_OPTIONS.map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] || 0})
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
          No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{app.teen_name}</h3>
                  <p className="text-sm text-gray-500">
                    Parent: {app.parent_name} · {app.parent_email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied {new Date(app.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <Badge className={statusColors[app.status] ?? 'bg-gray-100 text-gray-800'}>
                  {app.status}
                </Badge>
              </div>

              {app.teen_curiosity && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    What are you excitedly curious about?
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {app.teen_curiosity}
                  </p>
                </div>
              )}

              {app.teen_self_starter && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                    Self-assessment: ability to get started
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {app.teen_self_starter}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(app.id, s)}
                  >
                    → {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
