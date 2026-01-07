'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ConnectRobloxProps {
  robloxUsername?: string | null;
}

export function ConnectRoblox({ robloxUsername }: ConnectRobloxProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!robloxUsername;

  const handleConnect = async (usernameToConnect?: string) => {
    setError(null);

    const usernameToUse = usernameToConnect || input.trim();

    if (!usernameToUse) {
      setError('Please enter your Roblox username');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Connecting to Roblox...');

    try {
      const response = await fetch('/api/connect-roblox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Roblox');
      }

      toast.dismiss(loadingToast);
      toast.success('Roblox connected!', {
        description: `Connected as ${data.profile.name}`,
      });

      setInput('');
      router.refresh();
    } catch (err: any) {
      console.error('Connection error:', err);
      toast.dismiss(loadingToast);
      
      if (err.message.includes('rate limit') || err.message.includes('Too many requests')) {
        toast.error('Too many attempts', {
          description: 'Please wait a minute and try again.',
        });
        setError('Rate limit reached. Please wait 60 seconds and try again.');
      } else {
        toast.error('Connection failed', {
          description: err.message,
        });
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Roblox Connected</h3>
            <p className="text-sm text-gray-600">
              Connected as: <strong>{robloxUsername}</strong>
            </p>
          </div>
          <div className="text-4xl">✅</div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => handleConnect(robloxUsername || '')}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Roblox Data'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">Connect Roblox Account</h3>
          <p className="text-sm text-gray-600">
            Connect your Roblox account to get personalized project recommendations
            based on the games you play and create.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="roblox-input">Roblox Username</Label>
          <Input
            id="roblox-input"
            type="text"
            placeholder="YourRobloxUsername"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              How do I find my Roblox username?
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              <p>1. Go to Roblox.com and log in</p>
              <p>2. Click on your profile icon (top right)</p>
              <p>3. Your username is shown under your display name</p>
              <p className="font-mono bg-gray-100 p-1 rounded mt-2">
                Display Name: <strong>Cool Player</strong><br />
                @<strong>YourUsername</strong> ← This is what you need
              </p>
            </div>
          </details>
        </div>

        <Button
          onClick={() => handleConnect()}
          disabled={loading || !input.trim()}
          className="w-full"
        >
          {loading ? 'Connecting...' : 'Connect Roblox Account'}
        </Button>
      </div>
    </Card>
  );
}