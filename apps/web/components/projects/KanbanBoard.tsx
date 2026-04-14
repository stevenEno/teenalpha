'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Task } from '@teen-alpha/database';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { updateTask } from '@teen-alpha/database';
import type { ViewerRole } from './ProjectPageClient';

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
  viewerRole: ViewerRole;
  currentUserId: string;
  onEditTask: (task: Task) => void;
  onAddEvidence: (task: Task) => void;
  onViewEvidence: (task: Task) => void;
  onTasksChange?: (tasks: Task[]) => void;
  onRefresh?: () => void;
}

type Status = 'todo' | 'in_progress' | 'done';

export function KanbanBoard({
  projectId,
  initialTasks,
  viewerRole,
  currentUserId,
  onEditTask,
  onAddEvidence,
  onViewEvidence,
  onTasksChange,
  onRefresh,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const originalStatusRef = useRef<Status | null>(null);

  const isMentor = viewerRole === 'mentor' || viewerRole === 'admin';
  const isOwner = viewerRole === 'owner';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const flash = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  const revert = (taskId: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      originalStatusRef.current = task.status;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overId = over.id as string;
    if (!['todo', 'in_progress', 'done'].includes(overId)) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overId as Status } : t))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalStatus = originalStatusRef.current;
    const activeId = active.id as string;
    const task = tasks.find((t) => t.id === activeId);

    setActiveTask(null);
    originalStatusRef.current = null;

    if (!task || !originalStatus) return;

    if (!over) {
      revert(activeId, originalStatus);
      return;
    }

    let newStatus: Status = task.status;
    if (['todo', 'in_progress', 'done'].includes(over.id as string)) {
      newStatus = over.id as Status;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus === originalStatus) return;

    // RULE 1: todo → in_progress requires evidence (teen or mentor)
    if (originalStatus === 'todo' && newStatus === 'in_progress') {
      if (!task.evidence_url) {
        revert(activeId, 'todo');
        flash('Attach evidence before moving this card to In Progress.');
        onAddEvidence(task);
        return;
      }
    }

    // RULE 1b: teens cannot skip In Progress. Block any todo → done drop.
    if (originalStatus === 'todo' && newStatus === 'done' && !isMentor) {
      revert(activeId, 'todo');
      flash('Move to In Progress first, attach evidence, then request mentor approval.');
      return;
    }

    // RULE 2: in_progress → done
    if (originalStatus === 'in_progress' && newStatus === 'done') {
      if (isMentor) {
        // Mentor approving: mark approved + done
        try {
          const updates = {
            status: 'done' as const,
            awaiting_approval: false,
            mentor_approved_by: currentUserId,
            mentor_approved_at: new Date().toISOString(),
            mentor_rejection_reason: null,
            completed_at: new Date().toISOString(),
          };
          setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
          await updateTask(activeId, updates);
          onTasksChange?.(tasks.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
          onRefresh?.();
          flash('Approved.');
        } catch (e) {
          console.error(e);
          revert(activeId, originalStatus);
        }
        return;
      }

      if (isOwner) {
        // Teen requests approval — card stays in_progress but flagged
        try {
          const updates = {
            status: 'in_progress' as const,
            awaiting_approval: true,
            approval_requested_at: new Date().toISOString(),
            mentor_rejection_reason: null,
          };
          setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
          await updateTask(activeId, updates);
          onTasksChange?.(tasks.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
          flash('Approval requested. Your mentor will review and approve.');
        } catch (e) {
          console.error(e);
          revert(activeId, originalStatus);
        }
        return;
      }

      // Not owner, not mentor — block
      revert(activeId, originalStatus);
      flash('Only a mentor can move tasks to Done.');
      return;
    }

    // RULE 3: done → anything else — only mentors can undo a completion
    if (originalStatus === 'done' && !isMentor) {
      revert(activeId, 'done');
      flash('Only a mentor can move a completed task back.');
      return;
    }

    // Default: apply the move
    try {
      const updates: Partial<Task> = {
        status: newStatus,
        completed_at:
          newStatus === 'done' && !task.completed_at
            ? new Date().toISOString()
            : newStatus !== 'done'
            ? null
            : task.completed_at,
      };
      setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
      await updateTask(activeId, updates);
      onTasksChange?.(tasks.map((t) => (t.id === activeId ? { ...t, ...updates } : t)));
    } catch (e) {
      console.error(e);
      revert(activeId, originalStatus);
    }
  };

  const handleApprove = async (task: Task) => {
    try {
      const updates = {
        status: 'done' as const,
        awaiting_approval: false,
        mentor_approved_by: currentUserId,
        mentor_approved_at: new Date().toISOString(),
        mentor_rejection_reason: null,
        completed_at: new Date().toISOString(),
      };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      await updateTask(task.id, updates);
      onRefresh?.();
      flash('Approved.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (task: Task) => {
    const reason = window.prompt('Reason for rejecting this task? (shown to teen)');
    if (reason === null) return;
    try {
      const updates = {
        awaiting_approval: false,
        mentor_rejection_reason: reason || 'Needs more work.',
      };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      await updateTask(task.id, updates);
      onRefresh?.();
      flash('Sent back to teen with feedback.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {banner && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2 text-sm">
          {banner}
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:overflow-x-auto pb-4">
          <KanbanColumn
            id="todo"
            title="To Do"
            tasks={todoTasks}
            color="gray"
            viewerRole={viewerRole}
            onEditTask={onEditTask}
            onAddEvidence={onAddEvidence}
            onViewEvidence={onViewEvidence}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          <KanbanColumn
            id="in_progress"
            title="In Progress"
            tasks={inProgressTasks}
            color="blue"
            viewerRole={viewerRole}
            onEditTask={onEditTask}
            onAddEvidence={onAddEvidence}
            onViewEvidence={onViewEvidence}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          <KanbanColumn
            id="done"
            title="Done"
            tasks={doneTasks}
            color="green"
            viewerRole={viewerRole}
            onEditTask={onEditTask}
            onAddEvidence={onAddEvidence}
            onViewEvidence={onViewEvidence}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
        <DragOverlay>
          {activeTask ? (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="opacity-80"
            >
              <TaskCard task={activeTask} viewerRole={viewerRole} onEdit={() => {}} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
