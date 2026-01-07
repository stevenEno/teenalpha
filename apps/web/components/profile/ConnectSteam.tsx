'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ConnectSteamProps {
  steamId?: string | null;
  steamProfileName?: string | null;
}

export function ConnectSteam({ steamId, steamProfileName }: ConnectSteamProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!steamId;

  const handleConnect = async (idToConnect?: string) => {
    setError(null);

    const steamIdToUse = idToConnect || input.trim();

    if (!steamIdToUse) {
      setError('Please enter your Steam ID or profile URL');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Connecting to Steam...');

    try {
      const response = await fetch('/api/connect-steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamId: steamIdToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Steam');
      }

      toast.dismiss(loadingToast);
      toast.success('Steam connected!', {
        description: `Connected as ${data.profile.name}. Found ${data.analysis.topGames.length} games!`,
      });

      setInput('');
      router.refresh();
    } catch (err: any) {
      console.error('Connection error:', err);
      toast.dismiss(loadingToast);
      toast.error('Connection failed', {
        description: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Steam Connected</h3>
            <p className="text-sm text-gray-600">
              Connected as: <strong>{steamProfileName}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Steam ID: {steamId}
            </p>
          </div>
          <div className="text-4xl">✅</div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => handleConnect(steamId || '')}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Gaming Data'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">Connect Steam Account</h3>
          <p className="text-sm text-gray-600">
            Connect your Steam account to get personalized project recommendations
            based on the games you play.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="steam-input">Steam ID or Profile URL</Label>
          <Input
            id="steam-input"
            type="text"
            placeholder="76561198012345678 or steamcommunity.com/id/yourname"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              How do I find my Steam ID?
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              <p>1. Go to your Steam profile in a web browser</p>
              <p>2. Look at the URL:</p>
              <p className="font-mono bg-gray-100 p-1 rounded">
                steamcommunity.com/id/<strong>yourname</strong>
              </p>
              <p>Or:</p>
              <p className="font-mono bg-gray-100 p-1 rounded">
                steamcommunity.com/profiles/<strong>76561198...</strong>
              </p>
              <p>3. Copy either the full URL or just the ID/username</p>
            </div>
          </details>
        </div>

        <Button
          onClick={() => handleConnect()}
          disabled={loading || !input.trim()}
          className="w-full"
        >
          {loading ? 'Connecting...' : 'Connect Steam Account'}
        </Button>
      </div>
    </Card>
  );
}