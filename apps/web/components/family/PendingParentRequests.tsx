'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Parent {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Connection {
  id: string;
  relationship: string;
  verified: boolean;
  created_at: string;
  parent: Parent;
}

export function PendingParentRequests() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      // Only show connections for teens
      if (data.role === 'teen') {
        setConnections(data.connections || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(connectionId: string) {
    if (!verificationCode.trim()) {
      setVerifyError('Please enter the verification code');
      return;
    }

    setVerifyError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/family/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          verificationCode: verificationCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMessage('Connection verified! Your parent can now view your progress.');
      setVerificationCode('');
      setVerifyingId(null);

      // Update the connection in the list
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, verified: true } : c
        )
      );
    } catch (err: any) {
      setVerifyError(err.message);
    }
  }

  async function handleDecline(connectionId: string) {
    if (!confirm('Are you sure you want to decline this connection request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/family/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to decline request');
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

  const pendingConnections = connections.filter((c) => !c.verified);
  const verifiedConnections = connections.filter((c) => c.verified);

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </Card>
    );
  }

  // Don't show anything if there are no connections at all
  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Pending Connection Requests */}
      {pendingConnections.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>Parent Connection Requests</span>
            <Badge className="bg-yellow-200 text-yellow-800">
              {pendingConnections.length} pending
            </Badge>
          </h3>

          <div className="space-y-3">
            {pendingConnections.map((connection) => (
              <div
                key={connection.id}
                className="bg-white rounded-lg p-4 border border-yellow-200"
              >
                <div className="flex items-start gap-3">
                  {/* Parent Avatar */}
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
                    {connection.parent.avatar_url ? (
                      <img
                        src={connection.parent.avatar_url}
                        alt={connection.parent.full_name || 'Parent'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(connection.parent.full_name)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium">
                      {connection.parent.full_name || 'Parent'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {connection.parent.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested {new Date(connection.created_at).toLocaleDateString()}
                    </p>

                    {/* Verification Form */}
                    {verifyingId === connection.id ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-600">
                          Enter the 6-character code your parent gave you:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="e.g., A7B3C2"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value.toUpperCase())
                            }
                            maxLength={6}
                            className="font-mono text-lg tracking-wider uppercase w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleVerify(connection.id)}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setVerifyingId(null);
                              setVerificationCode('');
                              setVerifyError(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        {verifyError && (
                          <p className="text-red-600 text-sm">{verifyError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setVerifyingId(connection.id)}
                        >
                          Enter Code
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDecline(connection.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Verified Connections */}
      {verifiedConnections.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>Connected Parents</span>
            <Badge className="bg-green-100 text-green-800">
              {verifiedConnections.length}
            </Badge>
          </h3>

          <div className="space-y-2">
            {verifiedConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium flex-shrink-0">
                  {getInitials(connection.parent.full_name)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {connection.parent.full_name || 'Parent'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {connection.parent.email}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Connected
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
