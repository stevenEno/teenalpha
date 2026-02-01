'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import type { Task } from '@teen-alpha/database';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  onEditTask: (task: Task) => void;
  onAddEvidence?: (task: Task) => void;
  onViewEvidence?: (task: Task) => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  onEditTask,
  onAddEvidence,
  onViewEvidence,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const colorClasses = {
    gray: 'bg-gray-100',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
  };

  const accentColors = {
    gray: 'border-t-gray-400',
    blue: 'border-t-blue-500',
    green: 'border-t-green-500',
  };

  return (
    <div className="flex-1 min-w-[320px]">
      <div
        className={`rounded-xl border border-t-4 p-4 ${
          colorClasses[color as keyof typeof colorClasses]
        } ${accentColors[color as keyof typeof accentColors]}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>
          <span className="text-xs font-bold bg-white/80 rounded-full px-2.5 py-0.5 text-gray-600">
            {tasks.length}
          </span>
        </div>

        <div ref={setNodeRef} className="min-h-[200px]">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-8 text-gray-400 text-sm gap-2"
                >
                  <ClipboardList className="w-6 h-6" />
                  Drop tasks here
                </motion.div>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onAddEvidence={onAddEvidence}
                      onViewEvidence={onViewEvidence}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
