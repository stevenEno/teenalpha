'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface SprintEnrollment {
  id: string;
  sprint_id: string;
  status: string;
  current_week: number;
  project_title: string | null;
  first_dollar_earned: boolean;
  progress_percent: number;
  completed_tasks: number;
  total_tasks: number;
  sprint: {
    id: string;
    title: string;
    mentor: {
      full_name: string;
    };
  };
}

export function SprintWidget() {
  const [enrollment, setEnrollment] = useState<SprintEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sprints/enrollment')
      .then((res) => res.json())
      .then((data) => {
        const active = data.enrollments?.find(
          (e: SprintEnrollment) => e.status === 'enrolled' || e.status === 'active'
        );
        setEnrollment(active || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !enrollment) return null;

  const weekLabels = ['Discover', 'Build', 'Level Up', 'Ship & Earn'];

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {enrollment.sprint.title}
            </h3>
            <p className="text-sm text-gray-500">
              with {enrollment.sprint.mentor.full_name}
            </p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">
          Week {enrollment.current_week}
        </Badge>
      </div>

      {/* Week progress */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((week) => (
          <div key={week} className="flex-1">
            <div
              className={`h-2 rounded-full ${
                week < enrollment.current_week
                  ? 'bg-green-500'
                  : week === enrollment.current_week
                    ? 'bg-green-300'
                    : 'bg-gray-200'
              }`}
            />
            <p
              className={`text-xs mt-1 ${
                week <= enrollment.current_week
                  ? 'text-green-700'
                  : 'text-gray-400'
              }`}
            >
              {weekLabels[week - 1]}
            </p>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-600" />
            {enrollment.completed_tasks}/{enrollment.total_tasks} tasks
          </span>
          {enrollment.first_dollar_earned && (
            <span className="text-yellow-600">
              <DollarSign className="inline h-4 w-4 mr-1" />
              First dollar earned!
            </span>
          )}
        </div>
        <span className="text-sm text-green-600 font-medium">
          {enrollment.progress_percent}%
        </span>
      </div>

      {enrollment.project_title && (
        <p className="text-sm text-gray-600 mb-4">
          Building: <span className="font-medium text-gray-900">{enrollment.project_title}</span>
        </p>
      )}

      <Link href={`/dashboard/sprint/${enrollment.id}`}>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg">
          Continue Sprint
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}
