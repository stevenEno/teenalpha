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

interface KanbanBoardWrapperProps {
  projectId: string;
  projectTitle: string;
  initialTasks: Task[];
}

export function KanbanBoardWrapper({
  projectId,
  projectTitle,
  initialTasks,
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
  const [refreshKey, setRefreshKey] = useState(0); // Add this for forcing re-render

  // Update tasks when initialTasks change (from router.refresh)
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

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleCloseEvidenceDialog = () => {
    setEvidenceDialogOpen(false);
    setEvidenceTask(null);
  };

  const handleCloseViewerDialog = () => {
    setViewerDialogOpen(false);
    setViewingTask(null);
  };

  const handleSaveTask = () => {
    router.refresh();
    handleCloseEditDialog();
  };

  const handleEvidenceSuccess = (updatedTask: Task) => {
    console.log('🟢 Evidence uploaded for task:', updatedTask.id);
    console.log('   Has evidence_url?', !!updatedTask.evidence_url);
    
    // Update the task in local state immediately
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
    );
    
    // Force re-render by updating key
    setRefreshKey(prev => prev + 1);
    
    // Also refresh from server
    router.refresh();
  };

  const handleTasksChange = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  return (
    <>
      {/* Project Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <ProjectStats tasks={tasks} />
      </div>

      {/* Kanban Board - add key to force re-render */}
      <KanbanBoard
        key={refreshKey}
        projectId={projectId}
        initialTasks={tasks}
        onEditTask={handleEditTask}
        onAddEvidence={handleAddEvidence}
        onViewEvidence={handleViewEvidence}
        onTasksChange={handleTasksChange}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleSaveTask}
      />

      {/* Evidence Upload Dialog */}
      <EvidenceUploadDialog
        task={evidenceTask}
        projectId={projectId}
        open={evidenceDialogOpen}
        onClose={handleCloseEvidenceDialog}
        onSuccess={handleEvidenceSuccess}
      />

      {/* Evidence Viewer Dialog */}
      <EvidenceViewer
        task={viewingTask}
        open={viewerDialogOpen}
        onClose={handleCloseViewerDialog}
      />

      {/* Completion Celebration */}
      {showCelebration && (
        <CompletionCelebration
          projectTitle={projectTitle}
          totalTasks={tasks.length}
        />
      )}
    </>
  );
}