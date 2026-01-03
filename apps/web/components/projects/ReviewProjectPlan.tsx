'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createProject, createTask } from '@teen-alpha/database';
import type { AITaskGenerationResult } from '@teen-alpha/utils';

interface PendingProject {
  title: string;
  description: string;
  category: string;
  userId: string;
  aiData: AITaskGenerationResult;
}

export function ReviewProjectPlan() {
  const router = useRouter();
  const [pendingProject, setPendingProject] = useState<PendingProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load pending project from sessionStorage
    const stored = sessionStorage.getItem('pendingProject');
    if (!stored) {
      router.push('/projects/new');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setPendingProject(parsed);
    } catch (err) {
      console.error('Failed to parse pending project:', err);
      router.push('/projects/new');
    }
  }, [router]);

  const handleCreateProject = async () => {
    if (!pendingProject) return;

    setError(null);
    setLoading(true);

    try {
      // Create the project in database
      const project = await createProject({
        teen_id: pendingProject.userId,
        title: pendingProject.title,
        description: pendingProject.description,
        category: pendingProject.category,
        ai_generated: true,
        ai_prompt: pendingProject.description,
      });

      // Create all the AI-generated tasks
      const taskPromises = pendingProject.aiData.tasks.map((task, index) =>
        createTask({
          project_id: project.id,
          title: task.title,
          description: task.description,
          order_index: index,
          status: 'todo',
          ai_generated: true,
          suggested_evidence: task.suggestedEvidence,
        })
      );

      await Promise.all(taskPromises);

      // Clear the pending project
      sessionStorage.removeItem('pendingProject');

      // Redirect to the project page
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    sessionStorage.removeItem('pendingProject');
    router.push('/projects/new');
  };

  if (!pendingProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const { aiData } = pendingProject;
  const totalHours = aiData.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Overview */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {pendingProject.title}
            </h2>
            <p className="text-gray-600 mt-1">{pendingProject.description}</p>
          </div>
          <Badge variant="secondary">{pendingProject.category}</Badge>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">AI Project Summary:</p>
          <p className="text-blue-800">{aiData.projectSummary}</p>
        </div>

        <div className="flex items-center space-x-6 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Difficulty:</span>
            <Badge
              variant={
                aiData.difficulty === 'beginner'
                  ? 'default'
                  : aiData.difficulty === 'intermediate'
                  ? 'secondary'
                  : 'destructive'
              }
              className="ml-2"
            >
              {aiData.difficulty}
            </Badge>
          </div>
          <div>
            <span className="text-gray-500">Estimated Time:</span>
            <span className="font-medium ml-2">{totalHours} hours</span>
          </div>
          <div>
            <span className="text-gray-500">Tasks:</span>
            <span className="font-medium ml-2">{aiData.tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Your Project Roadmap</h3>
        <p className="text-gray-600 mb-6">
          Here's your personalized task breakdown. You can edit these tasks after
          creating the project.
        </p>

        <div className="space-y-4">
          {aiData.tasks.map((task, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                </div>
                <Badge variant="outline">{task.estimatedHours}h</Badge>
              </div>

              <p className="text-gray-700 ml-11 mb-3">{task.description}</p>

              <div className="ml-11 bg-gray-50 rounded p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  💡 Suggested Evidence:
                </p>
                <p className="text-sm text-gray-600">{task.suggestedEvidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-6">
        <Button variant="outline" onClick={handleStartOver} disabled={loading}>
          ← Start Over
        </Button>

        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            Ready to start building?
          </p>
          <Button
            onClick={handleCreateProject}
            disabled={loading}
            size="lg"
            className="px-8"
          >
            {loading ? 'Creating Project...' : 'Create Project →'}
          </Button>
        </div>
      </div>
    </div>
  );
}