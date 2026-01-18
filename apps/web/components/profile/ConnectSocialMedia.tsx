'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ConnectSocialMediaProps {
  platform: 'instagram' | 'tiktok' | 'snapchat';
  connectedAt?: string | null;
}

const platformInfo = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    description: 'Upload your Instagram data export for personalized recommendations',
    instructions: [
      'Open Instagram app → Settings → Account Center → Your Information and Permissions',
      'Download Your Information → Request a Download',
      'Choose JSON format and date range "All time"',
      'Wait 24-48 hours for email with download link',
      'Upload the ZIP file here',
    ],
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    description: 'Upload your TikTok data export for personalized recommendations',
    instructions: [
      'Open TikTok app → Profile → Menu (☰) → Settings and Privacy',
      'Tap "Account" → "Download your data"',
      'Select JSON format and tap "Request Data"',
      'Wait for email (usually 1-4 days) with download link',
      'Download and upload the ZIP file here',
    ],
  },
  snapchat: {
    name: 'Snapchat',
    icon: '👻',
    description: 'Upload your Snapchat data export for personalized recommendations',
    instructions: [
      'Go to accounts.snapchat.com and sign in',
      'Click "My Data" → "Submit Request"',
      'Wait for email with download link (usually 24 hours)',
      'Download and upload the ZIP file here',
    ],
  },
};

export function ConnectSocialMedia({ platform, connectedAt }: ConnectSocialMediaProps) {
  const router = useRouter();
  const info = platformInfo[platform];
  const isConnected = !!connectedAt;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      toast.error('File too large', {
        description: 'Please choose a file smaller than 50MB',
      });
      return;
    }

    // Validate file type (all platforms use ZIP files)
    if (!selectedFile.name.endsWith('.zip')) {
      setError('Please upload a ZIP file');
      toast.error('Invalid file type', {
        description: `${info.name} exports should be ZIP files`,
      });
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const loadingToast = toast.loading(`Analyzing your ${info.name} data...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload-${platform}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to upload ${info.name} data`);
      }

      toast.dismiss(loadingToast);
      toast.success(`${info.name} connected!`, {
        description: `Analyzed ${data.stats?.totalLikes || 'your'} likes and found ${data.analysis?.topInterests?.length || 'several'} interests`,
      });

      setFile(null);
      router.refresh();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.dismiss(loadingToast);
      toast.error('Upload failed', {
        description: err.message,
      });
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">{info.name} Connected</h3>
            <p className="text-sm text-gray-600">
              Data uploaded: {new Date(connectedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">{info.icon}</div>
          <div>
            <h3 className="font-semibold text-lg">{info.name}</h3>
            <p className="text-sm text-gray-600">{info.description}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="font-medium text-blue-900 mb-2">📋 How to get your data:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            {info.instructions.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ol>
        </div>

        <div className="space-y-2">
          <Input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Analyzing...' : 'Upload & Analyze'}
          </Button>
        </div>
      </div>
    </Card>
  );
}