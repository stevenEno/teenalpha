'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Rocket,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircle,
  Zap,
  DollarSign,
  ArrowLeft,
  Trophy,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface SprintTask {
  id: string;
  week: number;
  title: string;
  description: string;
  task_type: string;
  order_index: number;
  status: string;
  proof_text: string | null;
  proof_url: string | null;
  completed_at: string | null;
}

interface SprintEnrollment {
  id: string;
  sprint_id: string;
  status: string;
  current_week: number;
  project_title: string | null;
  project_description: string | null;
  first_dollar_earned: boolean;
  first_dollar_amount: number | null;
  first_dollar_method: string | null;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percent: number;
  completed_tasks: number;
  total_tasks: number;
  tasks: SprintTask[];
  weekly_tasks: Record<number, SprintTask[]>;
  sprint: {
    id: string;
    title: string;
    description: string;
    duration_weeks: number;
    mentor: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  };
}

const weekMeta = [
  { title: 'Discover Your Project', icon: MessageCircle, color: 'blue' },
  { title: 'Start Building', icon: Zap, color: 'purple' },
  { title: 'Level Up', icon: Rocket, color: 'orange' },
  { title: 'Ship & Earn', icon: DollarSign, color: 'green' },
];

export default function SprintDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params.id as string;

  const [enrollment, setEnrollment] = useState<SprintEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [proofInputs, setProofInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEnrollment();
  }, [enrollmentId]);

  async function fetchEnrollment() {
    try {
      const res = await fetch('/api/sprints/enrollment');
      const data = await res.json();
      const found = data.enrollments?.find(
        (e: SprintEnrollment) => e.id === enrollmentId
      );
      setEnrollment(found || null);

      // Auto-generate curriculum if enrolled but no tasks yet (only once per mount)
      if (found && found.total_tasks === 0 && !generating && !generationAttempted) {
        setGenerationAttempted(true);
        await generateCurriculum(found.id);
      }
    } catch (err) {
      console.error('Error fetching enrollment:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateCurriculum(eid: string) {
    setGenerating(true);
    try {
      const res = await fetch('/api/sprints/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: eid }),
      });
      if (res.ok) {
        // Re-fetch to get the generated tasks
        const enrollRes = await fetch('/api/sprints/enrollment');
        const data = await enrollRes.json();
        const found = data.enrollments?.find(
          (e: SprintEnrollment) => e.id === eid
        );
        setEnrollment(found || null);
      }
    } catch (err) {
      console.error('Error generating curriculum:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    setUpdatingTask(taskId);
    try {
      const proof = proofInputs[taskId];
      await fetch('/api/sprints/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: 'completed',
          proof_text: proof || undefined,
        }),
      });
      await fetchEnrollment();
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setUpdatingTask(null);
    }
  }

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        {generating && (
          <p className="text-gray-400 text-sm animate-pulse">
            Generating your personalized sprint curriculum...
          </p>
        )}
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Sprint enrollment not found.</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = enrollment.status === 'completed';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            {enrollment.sprint.title}
          </h1>
          <p className="text-gray-400">
            with {enrollment.sprint.mentor.full_name}
          </p>
        </div>
        {isCompleted ? (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm px-3 py-1">
            <Trophy className="h-4 w-4 mr-1" />
            Completed!
          </Badge>
        ) : (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-3 py-1">
            Week {enrollment.current_week} of 4
          </Badge>
        )}
      </div>

      {/* Overall progress */}
      <Card className="bg-gray-900 border-gray-800 p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm font-bold text-green-400">
            {enrollment.progress_percent}%
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${enrollment.progress_percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            {enrollment.completed_tasks} of {enrollment.total_tasks} tasks
          </span>
          {enrollment.project_title && (
            <span>
              Project: <span className="text-gray-300">{enrollment.project_title}</span>
            </span>
          )}
        </div>
      </Card>

      {/* First dollar celebration */}
      <AnimatePresence>
        {enrollment.first_dollar_earned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-yellow-900/40 to-orange-900/30 border-yellow-700/50 p-6 text-center">
              <DollarSign className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-yellow-400 mb-1">
                First Dollar Earned!
              </h3>
              {enrollment.first_dollar_amount && (
                <p className="text-yellow-200">
                  ${(enrollment.first_dollar_amount / 100).toFixed(2)} via{' '}
                  {enrollment.first_dollar_method || 'their project'}
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly breakdown */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((week) => {
          const meta = weekMeta[week - 1];
          const Icon = meta.icon;
          const tasks = enrollment.weekly_tasks[week] || [];
          const isCurrentWeek = week === enrollment.current_week;
          const isPastWeek = week < enrollment.current_week;
          const isFutureWeek = week > enrollment.current_week && !isCompleted;
          const weekComplete =
            tasks.length > 0 &&
            tasks.every((t) => t.status === 'completed' || t.status === 'skipped');

          return (
            <motion.div
              key={week}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: week * 0.1 }}
            >
              <Card
                className={`border p-6 transition-colors ${
                  isCurrentWeek
                    ? 'bg-gray-900 border-green-700/50'
                    : isPastWeek || isCompleted
                      ? 'bg-gray-900/50 border-gray-800'
                      : 'bg-gray-950 border-gray-800/50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      weekComplete || isPastWeek
                        ? 'bg-green-500/20'
                        : isCurrentWeek
                          ? 'bg-gray-800'
                          : 'bg-gray-900'
                    }`}
                  >
                    {weekComplete || (isPastWeek && !isCurrentWeek) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <Icon
                        className={`h-5 w-5 ${isCurrentWeek ? 'text-green-400' : 'text-gray-600'}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">
                      Week {week}: {meta.title}
                    </h3>
                  </div>
                  {isCurrentWeek && !isCompleted && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      Current
                    </Badge>
                  )}
                </div>

                {/* Tasks */}
                {tasks.length > 0 ? (
                  <div className="space-y-3 ml-2">
                    {tasks.map((task) => {
                      const isTaskComplete = task.status === 'completed';
                      const canComplete =
                        (isCurrentWeek || isPastWeek || isCompleted) && !isTaskComplete;

                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            isTaskComplete ? 'bg-green-500/5' : 'bg-gray-800/50'
                          }`}
                        >
                          {isTaskComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium text-sm ${
                                isTaskComplete
                                  ? 'text-gray-400 line-through'
                                  : 'text-white'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.description}
                            </p>
                            {task.proof_text && (
                              <p className="text-xs text-green-400 mt-1">
                                "{task.proof_text}"
                              </p>
                            )}
                            {canComplete && !isFutureWeek && (
                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  placeholder="What did you do? (optional)"
                                  value={proofInputs[task.id] || ''}
                                  onChange={(e) =>
                                    setProofInputs((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-xs bg-gray-900 border-gray-700"
                                />
                                <Button
                                  size="sm"
                                  disabled={updatingTask === task.id}
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="h-8 bg-green-600 hover:bg-green-700 text-xs shrink-0"
                                >
                                  {updatingTask === task.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Done
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                          {task.task_type !== 'action' && (
                            <Badge
                              variant="outline"
                              className="text-xs border-gray-700 text-gray-500 shrink-0"
                            >
                              {task.task_type}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : isFutureWeek ? (
                  <p className="text-sm text-gray-600 ml-2">
                    Complete Week {week - 1} to unlock.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 ml-2">
                    Tasks will be generated when you start this week.
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
