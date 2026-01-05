'use client';

import type { Task } from '@teen-alpha/database';

interface ProjectStatsProps {
  tasks: Task[];
}

export function ProjectStats({ tasks }: ProjectStatsProps) {
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const totalTasks = tasks.length;
  const completedTasks = doneTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-semibold text-gray-900">
            {completedTasks} / {totalTasks} tasks ({progress}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400 transition-all duration-300">
            {todoTasks.length}
          </p>
          <p className="text-sm text-gray-600">To Do</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 transition-all duration-300">
            {inProgressTasks.length}
          </p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 transition-all duration-300">
            {doneTasks.length}
          </p>
          <p className="text-sm text-gray-600">Done</p>
        </div>
      </div>
    </>
  );
}