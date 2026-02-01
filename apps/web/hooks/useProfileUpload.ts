'use client';

import { useState, useCallback } from 'react';

export function useProfileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const upload = useCallback(async (file: File, type: 'avatar' | 'banner' | 'background') => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLastUrl(data.url);
      return data;
    } catch (err: any) {
      const message = err.message || 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error, lastUrl };
}
