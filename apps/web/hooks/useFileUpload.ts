'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type Platform = 'instagram' | 'tiktok' | 'snapchat';

interface UploadResult {
  success: boolean;
  analysis?: {
    topInterests?: string[];
    contentThemes?: string[];
  };
  stats?: {
    totalLikedPosts?: number;
    totalLikes?: number;
  };
  error?: string;
}

interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({ onSuccess, onError }: UseFileUploadOptions = {}) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const validateFile = useCallback((selectedFile: File): string | null => {
    // Check file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      return 'File too large. Please choose a file smaller than 50MB.';
    }

    // Check file type
    if (!selectedFile.name.endsWith('.zip')) {
      return 'Please upload a ZIP file.';
    }

    return null;
  }, []);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      toast.error('Invalid file', { description: validationError });
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, [validateFile]);

  const uploadFile = useCallback(async (): Promise<UploadResult> => {
    if (!file || !selectedPlatform) {
      const errorMsg = 'Please select a platform and file';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUploading(true);
    setError(null);

    const loadingToast = toast.loading('Analyzing your data...', {
      description: 'This usually takes 10-30 seconds',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload-${selectedPlatform}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.dismiss(loadingToast);
      toast.success('Analysis complete!', {
        description: `Found ${data.analysis?.topInterests?.length || 'several'} interests`,
      });

      setUploadComplete(true);

      const result: UploadResult = {
        success: true,
        analysis: data.analysis,
        stats: data.stats,
      };

      onSuccess?.(result);
      return result;
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMsg = err.message || 'Upload failed';
      toast.error('Upload failed', { description: errorMsg });
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
    }
  }, [file, selectedPlatform, onSuccess, onError]);

  const reset = useCallback(() => {
    setSelectedPlatform(null);
    setFile(null);
    setError(null);
    setUploadComplete(false);
  }, []);

  return {
    // Platform selection
    selectedPlatform,
    setSelectedPlatform,

    // File handling
    file,
    handleFileSelect,

    // Upload state
    isUploading,
    uploadComplete,
    error,

    // Actions
    uploadFile,
    reset,

    // Helpers
    canUpload: !!file && !!selectedPlatform && !isUploading,
  };
}
