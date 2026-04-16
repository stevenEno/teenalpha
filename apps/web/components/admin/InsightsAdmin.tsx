'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Insight {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  author: string | null;
  takeaway: string | null;
  body_md: string | null;
  tags: string[];
  audience: string[];
  created_at: string;
}

const PLACEHOLDER = `---
title: Software Is Changing (Karpathy)
url: https://x.com/karpathy/status/...
source: Twitter
author: Andrej Karpathy
tags: [ai-careers, vertical-agents, autonomy]
takeaway: Teens should learn to direct AI agents on narrow tasks rather than just learn to code generically.
audience: [teens, mentors]
---

## Why this matters for teens

The default career advice — "learn to code" — is being inverted. Code is becoming a commodity that AI generates; the scarce skill is steering an agent to deliver actual value in a narrow domain.

## Concrete moves

- Pick one vertical you care about and ship a tiny agent that does one task there
- Watch what AI gets wrong; that's your durable advantage
`;

export function InsightsAdmin({ initialInsights }: { initialInsights: Insight[] }) {
  const router = useRouter();
  const [insights, setInsights] = useState(initialInsights);
  const [markdown, setMarkdown] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markdown.trim()) {
      setError('Paste an insight first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'failed');
      setInsights([j.insight, ...insights]);
      setMarkdown('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this insight?')) return;
    await fetch('/api/admin/insights', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setInsights(insights.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="markdown" className="block text-sm font-semibold text-gray-900 mb-2">
            Paste an insight (Obsidian markdown with frontmatter)
          </label>
          <textarea
            id="markdown"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={14}
            placeholder={PLACEHOLDER}
            className="w-full font-mono text-sm rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Frontmatter fields parsed: title, url, source, author, tags, takeaway, audience.
            Body becomes the rest. Title is required.
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? 'Saving…' : 'Save insight'}
        </Button>
      </form>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Captured ({insights.length})</h2>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No insights yet. Paste your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {insights.map((i) => (
              <li key={i.id} className="py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {i.title}
                    </h3>
                    {i.source && (
                      <span className="text-xs text-gray-500">· {i.source}</span>
                    )}
                    {i.author && (
                      <span className="text-xs text-gray-500">· {i.author}</span>
                    )}
                  </div>
                  {i.takeaway && (
                    <p className="text-sm text-gray-700 mb-2">{i.takeaway}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {i.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {i.audience.map((a) => (
                      <Badge key={`aud-${a}`} variant="secondary" className="text-xs">
                        {a}
                      </Badge>
                    ))}
                  </div>
                  {i.url && (
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Source →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => remove(i.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
