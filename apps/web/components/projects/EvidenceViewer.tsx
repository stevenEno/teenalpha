'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvidenceUrl } from '@teen-alpha/database';
import type { Task } from '@teen-alpha/database';

interface EvidenceViewerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function EvidenceViewer({ task, open, onClose }: EvidenceViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task?.evidence_url && open) {
      setLoading(true);
      getEvidenceUrl(task.evidence_url)
        .then((url) => setSignedUrl(url))
        .catch((err) => {
          console.error('Failed to get evidence URL:', err);
          setSignedUrl(null);
        })
        .finally(() => setLoading(false));
    }
  }, [task?.evidence_url, open]);

  if (!task || !task.evidence_url) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>Evidence of completion</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {task.evidence_description && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{task.evidence_description}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : signedUrl ? (
            <div className="border rounded-lg overflow-hidden">
              {task.evidence_type === 'image' && (
                <img
                  src={signedUrl}
                  alt="Evidence"
                  className="w-full max-h-[500px] object-contain bg-gray-100"
                />
              )}

              {task.evidence_type === 'video' && (
                <video
                  src={signedUrl}
                  controls
                  className="w-full max-h-[500px] bg-gray-100"
                >
                  Your browser doesn't support video playback.
                </video>
              )}

              {task.evidence_type === 'pdf' && (
                <div className="p-8 text-center">
                  <p className="mb-4">PDF Preview</p>
                  <Button asChild>
                    
                    <a href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer">
                      Open PDF in New Tab
                    </a>
                  </Button>
                </div>
              )}

              {!['image', 'video', 'pdf'].includes(task.evidence_type || '') && (
                <div className="p-8 text-center">
                  <Button asChild>
                    
                    <a href={signedUrl}
                      target="_blank"
                      rel="noopener noreferrer">
                      View File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load evidence
            </div>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {task.evidence_type || 'file'}
            </Badge>
            {task.completed_at && (
              <p className="text-xs text-gray-500">
                Completed: {new Date(task.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}