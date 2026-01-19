'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddTeenModal } from './AddTeenModal';
import Link from 'next/link';

interface Teen {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  grade: number | null;
  school: string | null;
  bio: string | null;
}

interface Connection {
  id: string;
  relationship: string;
  verified: boolean;
  verification_code: string;
  created_at: string;
  verified_at: string | null;
  teen: Teen;
}

export function ConnectedTeensSection() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const response = await fetch('/api/family/connections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connections');
      }

      setConnections(data.connections || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveConnection(connectionId: string) {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    try {
      const response = await fetch(`/api/family/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove connection');
      }

      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err: any) {
      setError(err.message);
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const verifiedConnections = connections.filter((c) => c.verified);
  const pendingConnections = connections.filter((c) => !c.verified);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Connected Teens</h3>
        <Button onClick={() => setShowAddModal(true)}>
          + Add Teen
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Connected</h4>
          <p className="text-3xl font-bold text-green-600">{verifiedConnections.length}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Pending Verification</h4>
          <p className="text-3xl font-bold text-yellow-600">{pendingConnections.length}</p>
        </Card>
      </div>

      {/* Pending Connections */}
      {pendingConnections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Awaiting Verification</h4>
          {pendingConnections.map((connection) => (
            <Card key={connection.id} className="p-4 border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-medium flex-shrink-0">
                  {getInitials(connection.teen.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{connection.teen.full_name || 'Teen'}</p>
                  <p className="text-sm text-gray-500">{connection.teen.email}</p>
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-gray-500">Verification Code:</p>
                    <p className="font-mono font-bold text-lg">{connection.verification_code}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Share this code with your teen to verify the connection
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveConnection(connection.id)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Verified Connections */}
      {verifiedConnections.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Your Teens</h4>
          {verifiedConnections.map((connection) => (
            <Card key={connection.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
                  {connection.teen.avatar_url ? (
                    <img
                      src={connection.teen.avatar_url}
                      alt={connection.teen.full_name || 'Teen'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(connection.teen.full_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{connection.teen.full_name || 'Teen'}</p>
                    <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {connection.teen.grade ? `Grade ${connection.teen.grade}` : ''}
                    {connection.teen.grade && connection.teen.school ? ' at ' : ''}
                    {connection.teen.school || ''}
                  </p>
                  {connection.teen.bio && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{connection.teen.bio}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/family/teen/${connection.teen.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveConnection(connection.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : pendingConnections.length === 0 ? (
        <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500">No teens connected yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Teen" to connect with your child's account.
            </p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              + Add Your First Teen
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Add Teen Modal */}
      <AddTeenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTeenAdded={fetchConnections}
      />
    </div>
  );
}
