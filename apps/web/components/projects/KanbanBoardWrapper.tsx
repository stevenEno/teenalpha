'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from './KanbanBoard';
import { EditTaskDialog } from './EditTaskDialog';
import { CompletionCelebration } from './CompletionCelebration';
import { ProjectStats } from './ProjectStats';
import { EvidenceUploadDialog } from './EvidenceUploadDialog';
import { EvidenceViewer } from './EvidenceViewer';
import type { Task } from '@teen-alpha/database';
import type { ViewerRole } from './ProjectPageClient';

interface KanbanBoardWrapperProps {
  projectId: string;
  projectTitle: string;
  initialTasks: Task[];
  viewerRole: ViewerRole;
  currentUserId: string;
}

export function KanbanBoardWrapper({
  projectId,
  projectTitle,
  initialTasks,
  viewerRole,
  currentUserId,
}: KanbanBoardWrapperProps) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const allCompleted = tasks.length > 0 && tasks.every((t) => t.status === 'done');
    const wereAllCompleted = initialTasks.length > 0 && initialTasks.every((t) => t.status === 'done');
    if (allCompleted && !wereAllCompleted) {
      setShowCelebration(true);
    }
  }, [tasks, initialTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleAddEvidence = (task: Task) => {
    setEvidenceTask(task);
    setEvidenceDialogOpen(true);
  };

  const handleViewEvidence = (task: Task) => {
    setViewingTask(task);
    setViewerDialogOpen(true);
  };

  const handleSaveTask = () => {
    router.refresh();
    setEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleEvidenceSuccess = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setRefreshKey((n) => n + 1);
    router.refresh();
  };

  const handleTasksChange = (updated: Task[]) => setTasks(updated);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <ProjectStats tasks={tasks} />
      </div>

      <KanbanBoard
        key={refreshKey}
        projectId={projectId}
        initialTasks={tasks}
        viewerRole={viewerRole}
        currentUserId={currentUserId}
        onEditTask={handleEditTask}
        onAddEvidence={handleAddEvidence}
        onViewEvidence={handleViewEvidence}
        onTasksChange={handleTasksChange}
        onRefresh={() => router.refresh()}
      />

      <EditTaskDialog
        task={editingTask}
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
      />

      <EvidenceUploadDialog
        task={evidenceTask}
        projectId={projectId}
        open={evidenceDialogOpen}
        onClose={() => { setEvidenceDialogOpen(false); setEvidenceTask(null); }}
        onSuccess={handleEvidenceSuccess}
      />

      <EvidenceViewer
        task={viewingTask}
        open={viewerDialogOpen}
        onClose={() => { setViewerDialogOpen(false); setViewingTask(null); }}
      />

      {showCelebration && (
        <CompletionCelebration
          projectTitle={projectTitle}
          totalTasks={tasks.length}
        />
      )}
    </>
  );
}
