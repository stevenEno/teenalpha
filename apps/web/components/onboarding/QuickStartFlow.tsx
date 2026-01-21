'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateProfile } from '@teen-alpha/database';
import type { Profile } from '@teen-alpha/database';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  CheckCircle,
  Rocket,
  Instagram,
  Smartphone,
  Ghost,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickStartFlowProps {
  profile: Profile;
  hasSocialData: boolean;
}

type Step = 'welcome' | 'basics' | 'upload' | 'complete';

export function QuickStartFlow({ profile, hasSocialData }: QuickStartFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(
    hasSocialData ? 'complete' : profile.grade ? 'upload' : 'welcome'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [grade, setGrade] = useState<number>(profile.grade || 9);
  const [school, setSchool] = useState<string>(profile.school || '');

  // Upload state
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'tiktok' | 'snapchat' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(hasSocialData);

  const handleSaveBasics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateProfile(profile.id, {
        grade,
        school,
      });
      setCurrentStep('upload');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File too large', { description: 'Please choose a file smaller than 50MB' });
      return;
    }

    if (!selectedFile.name.endsWith('.zip')) {
      toast.error('Invalid file type', { description: 'Please upload a ZIP file' });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !selectedPlatform) return;

    setUploading(true);
    setError(null);

    const loadingToast = toast.loading('Analyzing your data... This usually takes 10-30 seconds');

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
      setCurrentStep('complete');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error('Upload failed', { description: err.message });
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDiscoverPathways = () => {
    router.push('/dashboard/profile/data');
  };

  const handleSkipUpload = () => {
    router.push('/dashboard');
  };

  const platforms = [
    { id: 'instagram' as const, name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
    { id: 'tiktok' as const, name: 'TikTok', icon: Smartphone, color: 'from-cyan-500 to-blue-500' },
    { id: 'snapchat' as const, name: 'Snapchat', icon: Ghost, color: 'from-yellow-400 to-yellow-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-2">
          {['welcome', 'basics', 'upload', 'complete'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentStep === step
                    ? 'bg-indigo-600 scale-125'
                    : i < ['welcome', 'basics', 'upload', 'complete'].indexOf(currentStep)
                    ? 'bg-indigo-400'
                    : 'bg-gray-200'
                }`}
              />
              {i < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < ['welcome', 'basics', 'upload', 'complete'].indexOf(currentStep)
                      ? 'bg-indigo-400'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Welcome Step */}
      {currentStep === 'welcome' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {profile.full_name?.split(' ')[0] || 'there'}!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Let's discover your unique path in just 2 minutes.
            We'll analyze what you're already interested in and show you
            career opportunities you'll actually care about.
          </p>

          <div className="bg-indigo-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-indigo-900 mb-3">Here's what we'll do:</h3>
            <ul className="space-y-2 text-indigo-700">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Get a couple quick details from you</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Analyze your social media to find your real interests</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Show you startup paths that match who you actually are</span>
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            onClick={() => setCurrentStep('basics')}
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-6 text-lg"
          >
            Let's Go
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Basics Step */}
      {currentStep === 'basics' && (
        <div>
          <button
            onClick={() => setCurrentStep('welcome')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quick info about you
          </h1>
          <p className="text-gray-600 mb-8">
            This helps us personalize your experience.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What grade are you in?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`py-3 rounded-lg border-2 font-medium transition-colors ${
                      grade === g
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {g}th
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What school do you go to?
              </label>
              <Input
                type="text"
                placeholder="Enter your school name"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="py-6 text-lg"
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleSaveBasics}
            disabled={isLoading || !school.trim()}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 py-6 text-lg"
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <div>
          <button
            onClick={() => setCurrentStep('basics')}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            The magic step
          </h1>
          <p className="text-gray-600 mb-8">
            Upload your social media data and watch AI uncover your hidden interests
            and match them to real career opportunities.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Platform Selection */}
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-medium text-gray-700">
              Which platform do you use most?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPlatform === platform.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          {selectedPlatform && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                How to get your {selectedPlatform === 'instagram' ? 'Instagram' : selectedPlatform === 'tiktok' ? 'TikTok' : 'Snapchat'} data:
              </h3>
              {selectedPlatform === 'instagram' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Open Instagram → Settings → Account Center</li>
                  <li>Go to "Your Information and Permissions"</li>
                  <li>Tap "Download Your Information"</li>
                  <li>Choose JSON format and download</li>
                  <li>Upload the ZIP file below</li>
                </ol>
              )}
              {selectedPlatform === 'tiktok' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Open TikTok → Profile → Menu (☰)</li>
                  <li>Settings and Privacy → Account</li>
                  <li>Download your data → Request data (JSON)</li>
                  <li>Wait for email with download link</li>
                  <li>Upload the ZIP file below</li>
                </ol>
              )}
              {selectedPlatform === 'snapchat' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Go to accounts.snapchat.com</li>
                  <li>Sign in and click "My Data"</li>
                  <li>Click "Submit Request"</li>
                  <li>Wait for email with download link</li>
                  <li>Upload the ZIP file below</li>
                </ol>
              )}
              <p className="text-xs text-blue-600 mt-3">
                Note: Data requests can take 24-48 hours. You can skip this for now and come back later.
              </p>
            </div>
          )}

          {/* File Upload */}
          {selectedPlatform && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Click to select your ZIP file
                </label>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button
                size="lg"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze My Interests
                  </>
                )}
              </Button>
            </div>
          )}

          <button
            onClick={handleSkipUpload}
            className="w-full text-center text-gray-500 hover:text-gray-700 mt-4 text-sm"
          >
            Skip for now, I'll do this later
          </button>
        </div>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            You're all set!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            We've analyzed your data and found your unique interests.
            Now let's discover the startup paths that match who you really are.
          </p>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 mb-8">
            <Rocket className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your Startup Pathways Await
            </h3>
            <p className="text-gray-600">
              See AI-generated career paths connecting your interests to real
              startup opportunities. Choose one and start building your portfolio today.
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleDiscoverPathways}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-6 text-lg"
          >
            Discover My Pathways
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
