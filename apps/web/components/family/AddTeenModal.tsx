'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Teen {
  id: string;
  full_name: string | null;
  email: string | null;
  grade: number | null;
  school: string | null;
  avatar_url: string | null;
  connectionStatus: 'verified' | 'pending' | null;
}

interface AddTeenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeenAdded: () => void;
}

export function AddTeenModal({ isOpen, onClose, onTeenAdded }: AddTeenModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Teen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.length < 3) {
      setError('Please enter at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/family/search?email=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.teens || []);
      if (data.teens?.length === 0) {
        setError('No teens found with that email');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeen(teenId: string) {
    setAddingId(teenId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/family/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teenId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add teen');
      }

      setSuccessMessage(data.message);

      // Update the search results to show pending status
      setSearchResults((prev) =>
        prev.map((t) =>
          t.id === teenId ? { ...t, connectionStatus: 'pending' as const } : t
        )
      );

      // Notify parent component
      onTeenAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingId(null);
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Your Teen</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Search for your teen by their email address. They will need to verify the
          connection using a code.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter teen's email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-500">Search Results</h3>
            {searchResults.map((teen) => (
              <div
                key={teen.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
                  {teen.avatar_url ? (
                    <img
                      src={teen.avatar_url}
                      alt={teen.full_name || 'Teen'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(teen.full_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{teen.full_name || 'Teen'}</p>
                  <p className="text-sm text-gray-500 truncate">{teen.email}</p>
                  {teen.grade && (
                    <p className="text-xs text-gray-400">
                      Grade {teen.grade}
                      {teen.school ? ` at ${teen.school}` : ''}
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {teen.connectionStatus === 'verified' ? (
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  ) : teen.connectionStatus === 'pending' ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddTeen(teen.id)}
                      disabled={addingId === teen.id}
                    >
                      {addingId === teen.id ? 'Adding...' : 'Add'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Search for your teen by their email</li>
            <li>Click "Add" to send a connection request</li>
            <li>Your teen will receive a verification code</li>
            <li>Once verified, you can view their projects and progress</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
