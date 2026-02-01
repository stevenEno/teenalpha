'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { Task } from '@teen-alpha/database';
import { convertToAlpha } from '@/lib/incentives';

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
  const projectAlpha = convertToAlpha('quest', completedTasks * 10);

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
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          />
        </div>
        {projectAlpha > 0 && (
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--alpha-primary)' }}>
            <Zap className="w-3 h-3" />
            Project Alpha: {projectAlpha}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <motion.p
            className="text-2xl font-bold text-gray-400"
            key={todoTasks.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {todoTasks.length}
          </motion.p>
          <p className="text-sm text-gray-600">To Do</p>
        </div>
        <div className="text-center">
          <motion.p
            className="text-2xl font-bold text-blue-600"
            key={inProgressTasks.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {inProgressTasks.length}
          </motion.p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="text-center">
          <motion.p
            className="text-2xl font-bold text-green-600"
            key={doneTasks.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {doneTasks.length}
          </motion.p>
          <p className="text-sm text-gray-600">Done</p>
        </div>
      </div>
    </>
  );
}
