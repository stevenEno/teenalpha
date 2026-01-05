'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createTask } from '@teen-alpha/database';

interface AddTaskButtonProps {
  projectId: string;
  taskCount: number;
}

export function AddTaskButton({ projectId, taskCount }: AddTaskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedEvidence, setSuggestedEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createTask({
        project_id: projectId,
        title,
        description,
        suggested_evidence: suggestedEvidence,
        status: 'todo',
        order_index: taskCount, // Add to end
        ai_generated: false,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSuggestedEvidence('');
      setOpen(false);

      // Refresh page to show new task
      router.refresh();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        + Add Task
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a custom task for this project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-title">Task Title *</Label>
                <Input
                  id="new-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Research best practices"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs to be done..."
                  className="min-h-[100px]"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-evidence">Suggested Evidence</Label>
                <Textarea
                  id="new-evidence"
                  value={suggestedEvidence}
                  onChange={(e) => setSuggestedEvidence(e.target.value)}
                  placeholder="What should you provide as proof?"
                  className="min-h-[80px]"
                  disabled={loading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? 'Adding...' : 'Add Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}