'use client';

import { KanbanBoardWrapper } from './KanbanBoardWrapper';
import type { Task } from '@teen-alpha/database';

interface ProjectPageClientProps {
  projectId: string;
  projectTitle: string;
  initialTasks: Task[];
}

export function ProjectPageClient({
  projectId,
  projectTitle,
  initialTasks,
}: ProjectPageClientProps) {
  return (
    <KanbanBoardWrapper
      projectId={projectId}
      projectTitle={projectTitle}
      initialTasks={initialTasks}
    />
  );
}