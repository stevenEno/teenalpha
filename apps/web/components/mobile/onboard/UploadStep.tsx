'use client';

import { useRef } from 'react';
import { MobileButton, MobileCard } from '@/components/mobile';
import { type Platform } from '@/hooks/useFileUpload';
import { ArrowLeft, Upload, Instagram, Smartphone, Ghost, Sparkles } from 'lucide-react';

interface UploadStepProps {
  selectedPlatform: Platform | null;
  onPlatformSelect: (platform: Platform) => void;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onSkip: () => void;
  onBack: () => void;
  isUploading: boolean;
  canUpload: boolean;
  error: string | null;
}

const platforms = [
  {
    id: 'instagram' as Platform,
    name: 'Instagram',
    icon: Instagram,
    gradient: 'bg-[#FF6B35]',
    instructions: [
      'Open Instagram → Settings → Account Center',
      'Go to "Your Information and Permissions"',
      'Tap "Download Your Information"',
      'Choose JSON format and download',
      'Upload the ZIP file below',
    ],
  },
  {
    id: 'tiktok' as Platform,
    name: 'TikTok',
    icon: Smartphone,
    gradient: 'from-cyan-500 to-blue-500',
    instructions: [
      'Open TikTok → Profile → Menu (☰)',
      'Settings and Privacy → Account',
      'Download your data → Request data (JSON)',
      'Wait for email with download link',
      'Upload the ZIP file below',
    ],
  },
  {
    id: 'snapchat' as Platform,
    name: 'Snapchat',
    icon: Ghost,
    gradient: 'from-yellow-400 to-yellow-500',
    instructions: [
      'Go to accounts.snapchat.com',
      'Sign in and click "My Data"',
      'Click "Submit Request"',
      'Wait for email with download link',
      'Upload the ZIP file below',
    ],
  },
];

export function UploadStep({
  selectedPlatform,
  onPlatformSelect,
  file,
  onFileSelect,
  onUpload,
  onSkip,
  onBack,
  isUploading,
  canUpload,
  error,
}: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelect(selectedFile);
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 mb-6 touch-target"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        The magic step
      </h1>
      <p className="text-gray-600 mb-6">
        Upload your social media data and watch AI uncover your hidden interests.
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Platform Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Which platform do you use most?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                onClick={() => onPlatformSelect(platform.id)}
                className={`
                  p-4 rounded-xl border-2 transition-all touch-target
                  active:scale-[0.98]
                  ${selectedPlatform === platform.id
                    ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                    : 'border-gray-200'
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{platform.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      {selectedPlatformData && (
        <MobileCard className="bg-blue-50 border-blue-200 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            How to get your {selectedPlatformData.name} data:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            {selectedPlatformData.instructions.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ol>
          <p className="text-xs text-blue-600 mt-4">
            Note: Data requests can take 24-48 hours.
          </p>
        </MobileCard>
      )}

      {/* File Upload */}
      {selectedPlatform && (
        <div className="space-y-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-colors hover:border-gray-400 active:bg-gray-50"
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-[#FF6B35] font-medium mb-1">
              Tap to select your ZIP file
            </p>
            {file ? (
              <p className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Maximum file size: 50MB
              </p>
            )}
          </button>

          <MobileButton
            fullWidth
            size="lg"
            onClick={onUpload}
            loading={isUploading}
            disabled={!canUpload}
            icon={<Sparkles className="w-5 h-5" />}
          >
            Analyze My Interests
          </MobileButton>
        </div>
      )}

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="w-full text-center text-gray-500 py-3 text-sm"
      >
        Skip for now, I'll do this later
      </button>
    </div>
  );
}
