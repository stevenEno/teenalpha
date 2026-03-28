'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, CheckCircle2, Trophy } from 'lucide-react';

interface SprintEnrollment {
  id: string;
  status: string;
  current_week: number;
  project_title: string | null;
  first_dollar_earned: boolean;
  progress_percent: number;
  completed_tasks: number;
  total_tasks: number;
  sprint: {
    title: string;
    mentor: {
      full_name: string;
    };
  };
}

export function SprintProgressCard({ teenId }: { teenId: string }) {
  const [enrollments, setEnrollments] = useState<SprintEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sprints/enrollment?teen_id=${teenId}`)
      .then((res) => res.json())
      .then((data) => setEnrollments(data.enrollments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teenId]);

  if (loading || enrollments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Rocket className="h-5 w-5 text-green-500" />
        Sprints
      </h3>
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="p-4 border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold">{enrollment.sprint.title}</p>
              <p className="text-sm text-gray-500">
                with {enrollment.sprint.mentor.full_name}
              </p>
            </div>
            {enrollment.status === 'completed' ? (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="outline">Week {enrollment.current_week}/4</Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${enrollment.progress_percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              <CheckCircle2 className="inline h-3 w-3 mr-1" />
              {enrollment.completed_tasks}/{enrollment.total_tasks} tasks
            </span>
            <span>{enrollment.progress_percent}% complete</span>
          </div>

          {enrollment.project_title && (
            <p className="text-sm text-gray-600 mt-2">
              Project: <span className="font-medium">{enrollment.project_title}</span>
            </p>
          )}

          {enrollment.first_dollar_earned && (
            <p className="text-sm text-green-600 font-medium mt-1">
              First dollar earned!
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
