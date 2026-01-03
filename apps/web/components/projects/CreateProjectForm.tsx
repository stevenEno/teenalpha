'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PROJECT_CATEGORIES, type ProjectCategory } from '@teen-alpha/utils';

interface CreateProjectFormProps {
  userId: string;
  grade?: number;
}

export function CreateProjectForm({ userId, grade }: CreateProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Coding & Software');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate tasks from AI
      const aiResponse = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          grade,
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'Failed to generate tasks');
      }

      const { data: aiData } = await aiResponse.json();

      // Store the AI response temporarily and redirect to review page
      // We'll create the project after the user reviews the tasks
      sessionStorage.setItem('pendingProject', JSON.stringify({
        title,
        description,
        category,
        userId,
        aiData,
      }));

      router.push('/projects/review');
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Build a Weather App"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500">
          Give your project a clear, exciting name
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Project Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what you want to build and what you hope to learn. Be as specific as possible - this helps our AI create better tasks for you!"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={loading}
          className="min-h-[120px]"
        />
        <p className="text-sm text-gray-500">
          Minimum 20 characters. More detail = better AI suggestions!
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProjectCategory)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={loading}
        >
          {PROJECT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          ✨ AI-Powered Project Planning
        </h4>
        <p className="text-sm text-blue-800">
          Our AI will analyze your project and generate a personalized task list
          to help you get started. You'll be able to review and customize the tasks
          before creating your project.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || description.length < 20}
      >
        {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating your project plan...
        </span>
    ) : (
      'Generate Project Plan →'
    )}
      </Button>
    </form>
  );
}