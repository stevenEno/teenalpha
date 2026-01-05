'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateTask, deleteTask } from '@teen-alpha/database';
import type { Task } from '@teen-alpha/database';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditTaskDialog({
  task,
  open,
  onClose,
  onSave,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedEvidence, setSuggestedEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSuggestedEvidence(task.suggested_evidence || '');
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    setError(null);
    setLoading(true);

    try {
      await updateTask(task.id, {
        title,
        description,
        suggested_evidence: suggestedEvidence,
      });

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to update task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setError(null);
    setLoading(true);

    try {
      await deleteTask(task.id);
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      setError(err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details or delete the task.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showDeleteConfirm ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Are you sure you want to delete this task? This action cannot be
                undone.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Task'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs to be done"
                  className="min-h-[100px]"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence">Suggested Evidence</Label>
                <Textarea
                  id="evidence"
                  value={suggestedEvidence}
                  onChange={(e) => setSuggestedEvidence(e.target.value)}
                  placeholder="What should the student provide as proof?"
                  className="min-h-[80px]"
                  disabled={loading}
                />
              </div>

              {task.ai_generated && (
                <Alert>
                  <AlertDescription className="text-sm">
                    ✨ This task was generated by AI. Feel free to customize it
                    to fit your needs!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                Delete Task
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !title.trim()}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}