'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, ExternalLink } from 'lucide-react';

interface MentorSettingsProps {
  initial: {
    bio: string | null;
    calendly_url: string | null;
    expertise: string[] | null;
  };
}

export function MentorSettings({ initial }: MentorSettingsProps) {
  const [bio, setBio] = useState(initial.bio || '');
  const [calendlyUrl, setCalendlyUrl] = useState(initial.calendly_url || '');
  const [expertise, setExpertise] = useState((initial.expertise || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/mentor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          calendly_url: calendlyUrl,
          expertise: expertise
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 space-y-6 border-border">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Mentor Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          How teens and parents see you, and where they book sessions with you.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calendly_url">Scheduling link</Label>
        <Input
          id="calendly_url"
          type="url"
          placeholder="https://calendly.com/your-handle/session"
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Calendly or Cal.com URL. Teens enrolled in a Sprint click "Book mentor
          session" and open this link in a new tab to schedule their 1-on-1.
        </p>
        {calendlyUrl && /^https?:\/\//i.test(calendlyUrl) && (
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#FF6B35] hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Preview link
          </a>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="One or two sentences about your background and how you help teens."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expertise">Expertise</Label>
        <Input
          id="expertise"
          placeholder="startups, product design, python, sports coaching"
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Comma-separated. Shown as tags on your mentor card.</p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FF6B35] hover:bg-[#E85A24] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…
            </>
          ) : (
            'Save mentor settings'
          )}
        </Button>
        {savedAt && (
          <span className="inline-flex items-center gap-1 text-sm text-[#00C853]">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </Card>
  );
}
