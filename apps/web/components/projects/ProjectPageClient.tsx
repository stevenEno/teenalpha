'use client';

import { useState, useEffect } from 'react';
import { KanbanBoardWrapper } from './KanbanBoardWrapper';
import type { Task } from '@teen-alpha/database';

export type ViewerRole = 'owner' | 'mentor' | 'admin' | 'other';

interface ProjectPageClientProps {
  projectId: string;
  projectTitle: string;
  initialTasks: Task[];
  viewerRole: ViewerRole;
  currentUserId: string;
}

export function ProjectPageClient({
  projectId,
  projectTitle,
  initialTasks,
  viewerRole,
  currentUserId,
}: ProjectPageClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <KanbanBoardWrapper
      projectId={projectId}
      projectTitle={projectTitle}
      initialTasks={initialTasks}
      viewerRole={viewerRole}
      currentUserId={currentUserId}
    />
  );
}
