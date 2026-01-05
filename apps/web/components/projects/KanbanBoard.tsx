'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Task } from '@teen-alpha/database';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { updateTask } from '@teen-alpha/database';

interface KanbanBoardProps {
  projectId: string;
  initialTasks: Task[];
  onEditTask: (task: Task) => void;
  onTasksChange?: (tasks: Task[]) => void;
}

export function KanbanBoard({
  projectId,
  initialTasks,
  onEditTask,
  onTasksChange,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Track the ORIGINAL status before drag started
  const originalStatusRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      // Remember the original status
      originalStatusRef.current = task.status;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = ['todo', 'in_progress', 'done'].includes(
      overId as string
    );

    if (isOverColumn) {
      const newStatus = overId as 'todo' | 'in_progress' | 'done';
      
      // Update UI optimistically during drag
      setTasks((tasks) =>
        tasks.map((t) =>
          t.id === activeId ? { ...t, status: newStatus } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalStatus = originalStatusRef.current;
    
    setActiveTask(null);
    originalStatusRef.current = null;

    if (!over) {
      // Reset to original status if dropped outside
      if (originalStatus) {
        setTasks((tasks) =>
          tasks.map((t) =>
            t.id === active.id ? { ...t, status: originalStatus as any } : t
          )
        );
      }
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let newStatus = activeTask.status;
    
    if (['todo', 'in_progress', 'done'].includes(overId as string)) {
      newStatus = overId as 'todo' | 'in_progress' | 'done';
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // Compare against ORIGINAL status, not current
    if (newStatus !== originalStatus) {
      try {
        const updatedTasks = tasks.map((t) =>
          t.id === activeId
            ? {
                ...t,
                status: newStatus,
                completed_at:
                  newStatus === 'done' && !t.completed_at
                    ? new Date().toISOString()
                    : t.completed_at,
              }
            : t
        );
        
        setTasks(updatedTasks);

        // Update database
        await updateTask(activeId as string, {
          status: newStatus,
          completed_at:
            newStatus === 'done' && !activeTask.completed_at
              ? new Date().toISOString()
              : activeTask.completed_at,
        });

        // Notify parent - this will update the stats!
        onTasksChange?.(updatedTasks);
      } catch (error) {
        console.error('Failed to update task:', error);
        // Revert to original on error
        if (originalStatus) {
          const revertedTasks = tasks.map((t) =>
            t.id === activeId ? { ...t, status: originalStatus as any } : t
          );
          setTasks(revertedTasks);
          onTasksChange?.(revertedTasks);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={todoTasks}
          color="gray"
          onEditTask={onEditTask}
        />
        <KanbanColumn
          id="in_progress"
          title="In Progress"
          tasks={inProgressTasks}
          color="blue"
          onEditTask={onEditTask}
        />
        <KanbanColumn
          id="done"
          title="Done"
          tasks={doneTasks}
          color="green"
          onEditTask={onEditTask}
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <TaskCard task={activeTask} onEdit={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}