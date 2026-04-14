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
  Sparkles,
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
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
        {!enrollment.project_title && (
          <Link href="/dashboard/pick-project">
            <Button variant="outline" size="sm" className="border-[#FF6B35]/40 text-[#FF6B35] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]">
              <Sparkles className="h-4 w-4 mr-1" />
              Need project ideas?
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
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
      <Card className="p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Overall Progress</span>
          <span className="text-sm font-bold text-green-600">
            {enrollment.progress_percent}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
              Project: <span className="font-medium text-gray-700">{enrollment.project_title}</span>
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
            <Card className="bg-[#00C853]/10 border-[#00C853]/30 p-6 text-center">
              <DollarSign className="h-10 w-10 text-[#00C853] mx-auto mb-2" />
              <h3 className="text-xl font-bold text-[#00C853] mb-1">
                First Dollar Earned!
              </h3>
              {enrollment.first_dollar_amount && (
                <p className="text-[#00C853] tabular-nums">
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
                    ? 'bg-white border-green-300'
                    : isPastWeek || isCompleted
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      weekComplete || isPastWeek
                        ? 'bg-green-100'
                        : isCurrentWeek
                          ? 'bg-gray-100'
                          : 'bg-gray-100'
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
                    <h3 className="font-bold text-gray-900">
                      Week {week}: {meta.title}
                    </h3>
                  </div>
                  {isCurrentWeek && !isCompleted && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
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
                            isTaskComplete ? 'bg-green-50' : 'bg-gray-50'
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
                                  : 'text-gray-900'
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
                                  className="h-8 text-xs"
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
                              className="text-xs shrink-0"
                            >
                              {task.task_type}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : isFutureWeek ? (
                  <p className="text-sm text-muted-foreground ml-2">
                    Complete Week {week - 1} to unlock.
                  </p>
                ) : week === 1 ? (
                  // Week 1 empty-state guide. No dead end — two clear actions
                  // (pick a project, book the mentor session) with explanation.
                  <div className="ml-2 bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Here's how Week 1 works
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Pick a project idea, then book a 1-on-1 with your mentor
                        to lock it in. You've got{' '}
                        <span className="font-medium text-foreground">
                          one hour included
                        </span>{' '}
                        with this sprint. After the session, the weeks 2-4 build
                        tasks are already waiting below.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!enrollment.project_title ? (
                        <Link href="/dashboard/pick-project" className="flex-1">
                          <Button className="w-full bg-[#FF6B35] hover:bg-[#E85A24] text-white">
                            <Sparkles className="h-4 w-4 mr-1" />
                            1. Pick a project idea
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-[#FF6B35]/10 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-[#FF6B35] shrink-0" />
                          <span className="truncate">
                            Project: <span className="font-medium">{enrollment.project_title}</span>
                          </span>
                        </div>
                      )}
                      <Link href="/dashboard/sessions" className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-[#FF6B35]/40 text-[#FF6B35] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          2. Book mentor session
                        </Button>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your mentor for this sprint:{' '}
                      <span className="font-medium text-foreground">
                        {enrollment.sprint.mentor.full_name}
                      </span>
                    </p>
                  </div>
                ) : (
                  // Later weeks landing with 0 tasks — rare, means curriculum
                  // generation missed this week. Give a retry + escape hatch.
                  <div className="ml-2 bg-muted border border-border rounded-lg p-4 space-y-3">
                    <p className="text-sm text-foreground">
                      Week {week} tasks haven't been generated yet.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={generating}
                        onClick={() => generateCurriculum(enrollment.id)}
                      >
                        {generating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-1" />
                        )}
                        Regenerate tasks
                      </Button>
                      <Link href="/messages">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message mentor
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
