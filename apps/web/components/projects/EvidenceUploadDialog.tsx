'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { toast } from 'sonner';
import { uploadEvidence, updateTask } from '@teen-alpha/database';
import type { Task } from '@teen-alpha/database';

interface EvidenceUploadDialogProps {
  task: Task | null;
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
}

export function EvidenceUploadDialog({
  task,
  projectId,
  open,
  onClose,
  onSuccess,
}: EvidenceUploadDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      toast.error('File too large', {
        description: 'Please choose a file smaller than 10MB',
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not supported. Please upload an image, video, or PDF.');
      toast.error('Invalid file type', {
        description: 'Please upload an image, video, or PDF',
      });
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !task) return;

    setError(null);
    setLoading(true);

    // Show loading toast
    const loadingToast = toast.loading('Uploading evidence...');

    try {
      // Upload file to Supabase Storage
      const { path, url } = await uploadEvidence(file, projectId, task.id);

      // Determine evidence type
      let evidenceType = 'file';
      if (file.type.startsWith('image/')) evidenceType = 'image';
      if (file.type.startsWith('video/')) evidenceType = 'video';
      if (file.type === 'application/pdf') evidenceType = 'pdf';

      // Update task with evidence and get the updated task back
      const updatedTask = await updateTask(task.id, {
        evidence_url: path,
        evidence_type: evidenceType,
        evidence_description: description || file.name,
      });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Evidence uploaded!', {
        description: 'Your work has been documented.',
      });

      // Reset form
      setFile(null);
      setDescription('');
      setPreview(null);

      // Pass the updated task to the parent
      onSuccess(updatedTask);
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.dismiss(loadingToast);
      toast.error('Upload failed', {
        description: err.message || 'Failed to upload evidence',
      });
      setError(err.message || 'Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDescription('');
    setPreview(null);
    setError(null);
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Evidence</DialogTitle>
          <DialogDescription>
            Show proof that you completed: <strong>{task.title}</strong>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {task.suggested_evidence && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>💡 Suggested:</strong> {task.suggested_evidence}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="evidence-file">
              Upload Photo, Video, or PDF
            </Label>
            <Input
              id="evidence-file"
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Max file size: 10MB. Supported: JPG, PNG, GIF, MP4, MOV, PDF
            </p>
          </div>

          {preview && (
            <div className="border rounded-lg p-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded"
              />
            </div>
          )}

          {file && !preview && (
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="evidence-description">
              Description (Optional)
            </Label>
            <Textarea
              id="evidence-description"
              placeholder="Describe what this evidence shows..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Evidence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}