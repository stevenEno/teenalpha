'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Task } from '@teen-alpha/database';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  onEditTask: (task: Task) => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const colorClasses = {
    gray: 'bg-gray-100 border-gray-300',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  };

  const dotColors = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="flex-1 min-w-[320px]">
      <div
        className={`rounded-lg border-2 p-4 ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <span
              className={`w-3 h-3 rounded-full mr-2 ${
                dotColors[color as keyof typeof dotColors]
              }`}
            ></span>
            {title}
          </h2>
          <span className="text-sm font-medium text-gray-600">
            {tasks.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className="min-h-[200px]"
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Drop tasks here
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEditTask} />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}