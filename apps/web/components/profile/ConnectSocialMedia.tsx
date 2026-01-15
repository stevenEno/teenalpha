'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConnectSocialMediaProps {
  platform: 'instagram' | 'tiktok' | 'snapchat';
  connectedAt?: string | null;
}

const platformInfo = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    description: 'Upload your Instagram data export for personalized recommendations',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    description: 'Upload your TikTok data export for personalized recommendations',
  },
  snapchat: {
    name: 'Snapchat',
    icon: '👻',
    description: 'Upload your Snapchat data export for personalized recommendations',
  },
};

export function ConnectSocialMedia({ platform, connectedAt }: ConnectSocialMediaProps) {
  const info = platformInfo[platform];
  const isConnected = !!connectedAt;

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

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="font-medium text-blue-900 mb-2">📋 How to get your data:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            {platform === 'instagram' && (
              <>
                <li>Open Instagram app → Settings → Security → Download data</li>
                <li>Request download (takes 24-48 hours)</li>
                <li>Upload the JSON file here when ready</li>
              </>
            )}
            {platform === 'tiktok' && (
              <>
                <li>Open TikTok app → Settings → Privacy → Download your data</li>
                <li>Request download (takes 24-48 hours)</li>
                <li>Upload the JSON file here when ready</li>
              </>
            )}
            {platform === 'snapchat' && (
              <>
                <li>Go to accounts.snapchat.com → My Data</li>
                <li>Request download (takes 24-48 hours)</li>
                <li>Upload the JSON file here when ready</li>
              </>
            )}
          </ol>
        </div>

        <Button disabled className="w-full" variant="outline">
          Coming Soon - Upload {info.name} Data
        </Button>
      </div>
    </Card>
  );
}