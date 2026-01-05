'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from './KanbanBoard';
import { EditTaskDialog } from './EditTaskDialog';
import { CompletionCelebration } from './CompletionCelebration';
import { ProjectStats } from './ProjectStats';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);

  // Check if all tasks are completed
  useEffect(() => {
    const allCompleted = tasks.length > 0 && tasks.every((t) => t.status === 'done');
    const wereAllCompleted = initialTasks.length > 0 && initialTasks.every((t) => t.status === 'done');
    
    // Only show celebration if we JUST completed all tasks (not on initial load)
    if (allCompleted && !wereAllCompleted) {
      setShowCelebration(true);
    }
  }, [tasks, initialTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = () => {
    router.refresh();
    handleCloseDialog();
  };

  const handleTasksChange = (updatedTasks: Task[]) => {
    console.log('Tasks changed!', updatedTasks.length);
    console.log('Status breakdown:', {
      todo: updatedTasks.filter(t => t.status === 'todo').length,
      inProgress: updatedTasks.filter(t => t.status === 'in_progress').length,
      done: updatedTasks.filter(t => t.status === 'done').length,
    });
    setTasks(updatedTasks);
  };

  return (
    <>
      {/* Project Stats - now reactive */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <ProjectStats tasks={tasks} />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        projectId={projectId}
        initialTasks={tasks}
        onEditTask={handleEditTask}
        onTasksChange={handleTasksChange}
      />

      <EditTaskDialog
        task={editingTask}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveTask}
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