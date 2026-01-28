'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Upload, Sparkles, Instagram, Gamepad2 } from 'lucide-react';
import { StartupPathways } from '@/components/profile/StartupPathways';
import { ConnectSocialMedia } from '@/components/profile/ConnectSocialMedia';
import { ConnectSteam } from '@/components/profile/ConnectSteam';

interface PlatformData {
  platform: string;
  createdAt: string;
  updatedAt: string;
  rawData: any;
  aiAnalysis: any;
  profileDescription: string;
  stats: {
    categoriesDetected: number;
    topInterestsCount: number;
    suggestedSkillsCount: number;
  };
}

interface SocialData {
  profile: {
    id: string;
    email: string;
    role: 'teen' | 'mentor' | 'parent' | 'admin';
    instagramConnectedAt: string | null;
    tiktokConnectedAt: string | null;
    snapchatConnectedAt: string | null;
    instagramFilename: string | null;
    tiktokFilename: string | null;
    snapchatFilename: string | null;
    steamId: string | null;
    steamProfileName: string | null;
  };
  platforms: PlatformData[];
}

const platformIcons: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  snapchat: '👻',
};

const platformColors: Record<string, string> = {
  instagram: 'border-pink-300 bg-pink-50',
  tiktok: 'border-cyan-300 bg-cyan-50',
  snapchat: 'border-yellow-300 bg-yellow-50',
};

// Loading fallback for Suspense
function SocialDataPageLoading() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Main page wrapper with Suspense
export default function SocialDataPage() {
  return (
    <Suspense fallback={<SocialDataPageLoading />}>
      <SocialDataPageContent />
    </Suspense>
  );
}

// Actual page content that uses useSearchParams
function SocialDataPageContent() {
  const searchParams = useSearchParams();
  const focus = searchParams.get('focus'); // 'pathways' or 'upload'

  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);

  const pathwaysRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle focus parameter - scroll to relevant section and auto-open modal
  useEffect(() => {
    if (!loading && data && !hasAutoOpenedModal) {
      // Auto-open modal when focus=upload
      if (focus === 'upload') {
        setShowUploadModal(true);
        setHasAutoOpenedModal(true);
      }
      if (focus === 'pathways' && pathwaysRef.current) {
        pathwaysRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (focus === 'upload' && uploadRef.current) {
        uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [loading, data, focus, hasAutoOpenedModal]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile/social-data');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result);

      // Auto-expand all sections initially
      const expanded: Record<string, boolean> = {};
      result.platforms.forEach((p: PlatformData) => {
        expanded[`${p.platform}-raw`] = false;
        expanded[`${p.platform}-ai`] = true;
        expanded[`${p.platform}-profile`] = true;
        expanded[`${p.platform}-instagram-data`] = true; // Show Instagram data breakdown by default
      });
      setExpandedSections(expanded);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const DataQualityIndicator = ({ data }: { data: PlatformData }) => {
    const issues: string[] = [];

    // Check for potential data quality issues
    if (data.stats.categoriesDetected === 0) {
      issues.push('No categories detected from content');
    }
    if (data.stats.topInterestsCount === 0) {
      issues.push('AI could not identify top interests');
    }
    if (!data.aiAnalysis?.personalityInsights) {
      issues.push('No personality insights generated');
    }

    // Platform-specific checks
    if (data.platform === 'instagram') {
      if ((data.rawData?.totalLikedPosts || data.rawData?.totalLikes || 0) === 0) {
        issues.push('No likes data found');
      }
      if ((data.rawData?.totalFollowing || 0) === 0) {
        issues.push('No following data found');
      }
      if (!data.rawData?.topEngagedAccounts && !data.rawData?.topAccounts) {
        issues.push('No engaged accounts found');
      }
      if ((data.rawData?.totalPostsViewed || 0) === 0) {
        issues.push('No posts viewed data (ads_information/ads_and_topics/posts_viewed.json)');
      }
      if ((data.rawData?.totalVideosWatched || 0) === 0) {
        issues.push('No videos watched data (ads_information/ads_and_topics/videos_watched.json)');
      }
      if ((!data.rawData?.adTargetingCategories || data.rawData.adTargetingCategories.length === 0) &&
          (!data.rawData?.topicInterests || data.rawData.topicInterests.length === 0)) {
        issues.push('No Instagram interest categories found');
      }
    }

    if (data.platform === 'tiktok') {
      if ((data.rawData?.totalFavoriteVideos || 0) === 0) {
        issues.push('No favorite videos found');
      }
      if ((data.rawData?.totalSearches || 0) === 0) {
        issues.push('No search history found');
      }
      if (!data.rawData?.topSearches || data.rawData.topSearches.length === 0) {
        issues.push('No top searches identified');
      }
    }

    if (data.platform === 'snapchat') {
      if (!data.rawData?.topHashtags || data.rawData.topHashtags.length === 0) {
        issues.push('No spotlight hashtags found');
      }
      if ((data.rawData?.snapscore || 0) === 0) {
        issues.push('No snapscore found');
      }
    }

    if (issues.length === 0) {
      return (
        <div className="flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Data quality looks good</span>
        </div>
      );
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-yellow-800 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium text-sm">Potential Data Issues</span>
        </div>
        <ul className="text-sm text-yellow-700 space-y-1">
          {issues.map((issue, i) => (
            <li key={i}>• {issue}</li>
          ))}
        </ul>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/dashboard/profile" className="flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold">Social Media Data Analysis</h1>
          <p className="text-gray-600">
            See exactly what data was extracted from your uploads and what gets sent to AI
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Upload CTA for new users or when focused on upload */}
      {(focus === 'upload' || (!data?.platforms || data.platforms.length === 0)) && (
        <div ref={uploadRef}>
          <Card className="p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Discover What Makes You Unique
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your social media or gaming data and our AI will reveal hidden interests,
                passions, and project ideas tailored just for you.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-pink-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Instagram</h3>
                      <p className="text-xs text-gray-500">Export your data from Meta</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-cyan-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Steam</h3>
                      <p className="text-xs text-gray-500">Connect your gaming profile</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload My Data
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                Your data stays private. We only extract interest patterns to help you find projects.
              </p>
            </div>
          </Card>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Upload Your Data</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <ConnectSocialMedia
                      platform="instagram"
                      connectedAt={data?.profile?.instagramConnectedAt}
                      onSuccess={() => {
                        setShowUploadModal(false);
                        fetchData();
                      }}
                    />
                    <ConnectSocialMedia
                      platform="tiktok"
                      connectedAt={data?.profile?.tiktokConnectedAt}
                      onSuccess={() => {
                        setShowUploadModal(false);
                        fetchData();
                      }}
                    />
                    <ConnectSocialMedia
                      platform="snapchat"
                      connectedAt={data?.profile?.snapchatConnectedAt}
                      onSuccess={() => {
                        setShowUploadModal(false);
                        fetchData();
                      }}
                    />
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3">Or connect gaming accounts:</h3>
                      <ConnectSteam
                        steamId={data?.profile?.steamId}
                        steamProfileName={data?.profile?.steamProfileName}
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowUploadModal(false);
                          fetchData();
                        }}
                      >
                        Done - Refresh Page
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Connected Platforms</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {['instagram', 'tiktok', 'snapchat'].map((platform) => {
            const connectedAt = data?.profile?.[`${platform}ConnectedAt` as keyof typeof data.profile];
            const filename = data?.profile?.[`${platform}Filename` as keyof typeof data.profile];
            const isConnected = !!connectedAt;

            return (
              <div
                key={platform}
                className={`p-4 rounded-lg border-2 ${
                  isConnected ? platformColors[platform] : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platformIcons[platform]}</span>
                  <div>
                    <h3 className="font-semibold capitalize">{platform}</h3>
                    {isConnected ? (
                      <div className="text-sm text-gray-600">
                        <p>Connected: {new Date(connectedAt as string).toLocaleDateString()}</p>
                        {filename && <p className="truncate max-w-[150px]">File: {filename}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not connected</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Startup Pathways Section */}
      <div ref={pathwaysRef}>
        {data?.platforms && data.platforms.length > 0 && (
          <StartupPathways isAdmin={data.profile.role === 'admin'} autoGenerate={focus === 'pathways'} />
        )}
      </div>

      {/* No Data Message */}
      {(!data?.platforms || data.platforms.length === 0) && (
        <Alert>
          <AlertDescription>
            No social media data found. Upload a ZIP file from Instagram, TikTok, or Snapchat in your profile to see analysis data here.
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Data Sections */}
      {data?.platforms.map((platformData) => (
        <Card key={platformData.platform} className={`overflow-hidden border-2 ${platformColors[platformData.platform]}`}>
          {/* Platform Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{platformIcons[platformData.platform]}</span>
                <div>
                  <h2 className="text-2xl font-bold capitalize">{platformData.platform} Data</h2>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(platformData.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <p>{platformData.stats.categoriesDetected} categories detected</p>
                  <p>{platformData.stats.topInterestsCount} interests identified</p>
                  <p>{platformData.stats.suggestedSkillsCount} skills suggested</p>
                </div>
              </div>
            </div>

            {/* Data Quality Indicator */}
            <div className="mt-4">
              <DataQualityIndicator data={platformData} />
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="divide-y">
            {/* AI Analysis Section */}
            <div>
              <button
                onClick={() => toggleSection(`${platformData.platform}-ai`)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
              >
                <span className="font-semibold">AI Analysis Results</span>
                {expandedSections[`${platformData.platform}-ai`] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections[`${platformData.platform}-ai`] && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Top Interests</h4>
                      <div className="flex flex-wrap gap-1">
                        {(platformData.aiAnalysis?.topInterests || []).map((interest: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {interest}
                          </span>
                        ))}
                        {(!platformData.aiAnalysis?.topInterests || platformData.aiAnalysis.topInterests.length === 0) && (
                          <span className="text-sm text-gray-500">None identified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Content Themes</h4>
                      <div className="flex flex-wrap gap-1">
                        {(platformData.aiAnalysis?.contentThemes || []).map((theme: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {theme}
                          </span>
                        ))}
                        {(!platformData.aiAnalysis?.contentThemes || platformData.aiAnalysis.contentThemes.length === 0) && (
                          <span className="text-sm text-gray-500">None identified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Suggested Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {(platformData.aiAnalysis?.suggestedSkills || []).map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {(!platformData.aiAnalysis?.suggestedSkills || platformData.aiAnalysis.suggestedSkills.length === 0) && (
                          <span className="text-sm text-gray-500">None suggested</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Personality Insights</h4>
                    <p className="text-sm bg-white p-3 rounded border">
                      {platformData.aiAnalysis?.personalityInsights || 'No insights available'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Initial Project Recommendations</h4>
                    <ul className="text-sm bg-white p-3 rounded border space-y-1">
                      {(platformData.aiAnalysis?.projectRecommendations || []).map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                      {(!platformData.aiAnalysis?.projectRecommendations || platformData.aiAnalysis.projectRecommendations.length === 0) && (
                        <li className="text-gray-500">No recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Instagram-Specific Data Breakdown */}
            {platformData.platform === 'instagram' && (
              <div>
                <button
                  onClick={() => toggleSection(`${platformData.platform}-instagram-data`)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
                >
                  <span className="font-semibold">Instagram Data Breakdown (All Parsed Files)</span>
                  {expandedSections[`${platformData.platform}-instagram-data`] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {expandedSections[`${platformData.platform}-instagram-data`] && (
                  <div className="p-4 pt-0 space-y-4">
                    {/* Activity Stats Grid */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Activity Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-blue-600">{platformData.rawData?.totalLikedPosts || platformData.rawData?.totalLikes || 0}</p>
                          <p className="text-xs text-gray-500">Posts Liked</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-purple-600">{platformData.rawData?.totalPostsViewed || 0}</p>
                          <p className="text-xs text-gray-500">Posts Viewed</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-pink-600">{platformData.rawData?.totalVideosWatched || 0}</p>
                          <p className="text-xs text-gray-500">Videos Watched</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-green-600">{platformData.rawData?.totalSavedPosts || 0}</p>
                          <p className="text-xs text-gray-500">Posts Saved</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-indigo-600">{platformData.rawData?.totalFollowing || 0}</p>
                          <p className="text-xs text-gray-500">Following</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-cyan-600">{platformData.rawData?.totalFollowers || 0}</p>
                          <p className="text-xs text-gray-500">Followers</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-orange-600">{platformData.rawData?.totalSearches || 0}</p>
                          <p className="text-xs text-gray-500">Searches</p>
                        </div>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="text-lg font-bold text-red-600">{platformData.rawData?.totalAdsClicked || 0}</p>
                          <p className="text-xs text-gray-500">Ads Clicked</p>
                        </div>
                      </div>
                    </div>

                    {/* Top Viewed Creators */}
                    {(platformData.rawData?.topViewedCreators || []).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Top Viewed Creators (from posts_viewed.json)</h4>
                        <div className="flex flex-wrap gap-1">
                          {(platformData.rawData?.topViewedCreators || []).slice(0, 20).map((c: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {c.account} ({c.count}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Watched Video Creators */}
                    {(platformData.rawData?.topWatchedCreators || []).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Top Watched Video Creators (from videos_watched.json)</h4>
                        <div className="flex flex-wrap gap-1">
                          {(platformData.rawData?.topWatchedCreators || []).slice(0, 20).map((c: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                              {c.account} ({c.count}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Liked Accounts */}
                    {((platformData.rawData?.topEngagedAccounts || platformData.rawData?.topAccounts) || []).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Top Liked Accounts</h4>
                        <div className="flex flex-wrap gap-1">
                          {(platformData.rawData?.topEngagedAccounts || platformData.rawData?.topAccounts || []).slice(0, 20).map((a: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {a.account} ({a.count}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Saved Accounts */}
                    {(platformData.rawData?.topSavedAccounts || []).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Top Saved Accounts</h4>
                        <div className="flex flex-wrap gap-1">
                          {(platformData.rawData?.topSavedAccounts || []).slice(0, 15).map((a: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {a.account} ({a.count}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instagram's Own Interest Data */}
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-sm text-yellow-800 mb-2">Instagram's Own Interest Categories (Very Valuable!)</h4>
                      <div className="space-y-2">
                        {(platformData.rawData?.adTargetingCategories || []).length > 0 && (
                          <div>
                            <p className="text-xs text-yellow-700 font-medium">Ad Targeting Categories:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(platformData.rawData?.adTargetingCategories || []).slice(0, 20).map((cat: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-yellow-200 text-yellow-900 text-xs rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(platformData.rawData?.topicInterests || []).length > 0 && (
                          <div>
                            <p className="text-xs text-yellow-700 font-medium">Topic Interests:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(platformData.rawData?.topicInterests || []).slice(0, 20).map((topic: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-orange-200 text-orange-900 text-xs rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(platformData.rawData?.adInterests || []).length > 0 && (
                          <div>
                            <p className="text-xs text-yellow-700 font-medium">Ad Interests:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(platformData.rawData?.adInterests || []).slice(0, 20).map((interest: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-amber-200 text-amber-900 text-xs rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(platformData.rawData?.adTargetingCategories || []).length === 0 &&
                         (platformData.rawData?.topicInterests || []).length === 0 &&
                         (platformData.rawData?.adInterests || []).length === 0 && (
                          <p className="text-xs text-yellow-600">No Instagram interest data found. This data comes from instagram_ads_and_businesses/ and your_topics/ folders.</p>
                        )}
                      </div>
                    </div>

                    {/* Search Behavior */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Search Behavior</h4>
                      <div className="grid md:grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs font-medium text-gray-600 mb-1">Word Searches</p>
                          <p className="text-xs text-gray-500">
                            {(platformData.rawData?.recentWordSearches || platformData.rawData?.recentSearches || []).slice(0, 10).join(', ') || 'None'}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs font-medium text-gray-600 mb-1">Tag Searches</p>
                          <p className="text-xs text-gray-500">
                            {(platformData.rawData?.recentTagSearches || []).slice(0, 10).join(', ') || 'None'}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs font-medium text-gray-600 mb-1">Account Searches</p>
                          <p className="text-xs text-gray-500">
                            {(platformData.rawData?.recentAccountSearches || []).slice(0, 10).join(', ') || 'None'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* External Links */}
                    {(platformData.rawData?.topDomainsVisited || []).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">External Links Clicked (Top Domains)</h4>
                        <div className="flex flex-wrap gap-1">
                          {(platformData.rawData?.topDomainsVisited || []).slice(0, 15).map((d: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              {d.domain} ({d.count}x)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User's Own Content */}
                    {(platformData.rawData?.isContentCreator) && (
                      <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                        <h4 className="font-medium text-sm text-cyan-800 mb-2">User's Own Content (Content Creator)</h4>
                        <div className="space-y-2 text-xs">
                          {(platformData.rawData?.postCaptions || []).length > 0 && (
                            <div>
                              <p className="font-medium text-cyan-700">Recent Post Captions:</p>
                              <ul className="list-disc list-inside text-cyan-600">
                                {(platformData.rawData?.postCaptions || []).slice(0, 5).map((caption: string, i: number) => (
                                  <li key={i} className="truncate">{caption}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(platformData.rawData?.sampleComments || []).length > 0 && (
                            <div>
                              <p className="font-medium text-cyan-700">Sample Comments:</p>
                              <ul className="list-disc list-inside text-cyan-600">
                                {(platformData.rawData?.sampleComments || []).slice(0, 5).map((comment: string, i: number) => (
                                  <li key={i} className="truncate">{comment}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Description Section (What gets sent to AI) */}
            <div>
              <button
                onClick={() => toggleSection(`${platformData.platform}-profile`)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
              >
                <span className="font-semibold">Profile Description (Sent to AI for Projects)</span>
                {expandedSections[`${platformData.platform}-profile`] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections[`${platformData.platform}-profile`] && (
                <div className="p-4 pt-0">
                  <p className="text-sm text-gray-600 mb-2">
                    This is the exact text that gets inserted into the AI prompt when generating project recommendations:
                  </p>
                  <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {platformData.profileDescription}
                  </pre>
                </div>
              )}
            </div>

            {/* Raw Data Section */}
            <div>
              <button
                onClick={() => toggleSection(`${platformData.platform}-raw`)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
              >
                <span className="font-semibold">Raw Extracted Data</span>
                {expandedSections[`${platformData.platform}-raw`] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections[`${platformData.platform}-raw`] && (
                <div className="p-4 pt-0">
                  <p className="text-sm text-gray-600 mb-2">
                    This is the anonymized data extracted from the ZIP file:
                  </p>
                  <pre className="text-xs bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto max-h-96">
                    {JSON.stringify(platformData.rawData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Troubleshooting Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-lg mb-3">Troubleshooting Generic Recommendations</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">If categories are empty:</h4>
            <p className="text-gray-700">
              The ZIP file might not contain enough activity data, or the file structure might be different than expected.
              Check the "Raw Extracted Data" section to see what was actually parsed.
            </p>
          </div>
          <div>
            <h4 className="font-medium">If AI interests are generic:</h4>
            <p className="text-gray-700">
              The prompt might need tuning. Go to <Link href="/admin/prompts" className="text-blue-600 underline">Manage Prompts</Link> to
              adjust how the AI analyzes the data. Try adding more specific instructions about the user's data.
            </p>
          </div>
          <div>
            <h4 className="font-medium">If profile description is sparse:</h4>
            <p className="text-gray-700">
              The data being sent to the AI lacks detail. This could mean the parsing functions aren't extracting enough
              information, or the user's actual activity on the platform is limited.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
