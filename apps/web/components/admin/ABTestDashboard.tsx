'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, Users, MousePointerClick, Rocket, HelpCircle } from 'lucide-react';

interface FunnelData {
  variant: string;
  views: number;
  signups_started: number;
  signups_completed: number;
  onboarding_completed: number;
  view_to_signup_rate: number;
  signup_to_complete_rate: number;
}

interface AnalyticsData {
  funnel: FunnelData[];
  dailyStats: Record<string, Record<string, { views: number; signups: number }>>;
  summary: {
    totalUniqueVisitors: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

// Question variant colors and names
const QUESTION_VARIANT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'curious': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  'youtube': { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
  'unprompted': { bg: 'bg-lime-50', text: 'text-lime-700', bar: 'bg-lime-500' },
  'pain': { bg: 'bg-pink-50', text: 'text-pink-700', bar: 'bg-pink-500' },
};

const QUESTION_VARIANT_NAMES: Record<string, string> = {
  'curious': 'What are you excitedly curious about?',
  'youtube': 'What YouTube rabbit holes do you fall into?',
  'unprompted': 'What do you explore without being told to?',
  'pain': 'What pain are you willing to endure?',
};

// Legacy landing page variants (for historical data)
const LEGACY_VARIANT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'screen-time': { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  'grow': { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'leapfrog': { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
  'purpose': { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  'craft': { bg: 'bg-violet-50', text: 'text-violet-700', bar: 'bg-violet-500' },
};

const LEGACY_VARIANT_NAMES: Record<string, string> = {
  'screen-time': 'Screen Time (archived)',
  'grow': 'Grow (archived)',
  'leapfrog': 'Leapfrog (archived)',
  'purpose': 'Purpose (archived)',
  'craft': 'Craft (archived)',
};

function getVariantColors(variant: string) {
  return QUESTION_VARIANT_COLORS[variant] || LEGACY_VARIANT_COLORS[variant] || { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-500' };
}

function getVariantName(variant: string) {
  return QUESTION_VARIANT_NAMES[variant] || LEGACY_VARIANT_NAMES[variant] || variant;
}

function isQuestionVariant(variant: string) {
  return variant in QUESTION_VARIANT_COLORS;
}

export function ABTestDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [showLegacy, setShowLegacy] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/stats?days=${days}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  // Filter funnel data by variant type
  const questionFunnel = data?.funnel?.filter(f => isQuestionVariant(f.variant)) || [];
  const legacyFunnel = data?.funnel?.filter(f => !isQuestionVariant(f.variant)) || [];

  // Find the winning question variant
  const getWinner = () => {
    if (questionFunnel.length === 0) return null;
    const sorted = [...questionFunnel].sort((a, b) => b.view_to_signup_rate - a.view_to_signup_rate);
    if (sorted[0]?.view_to_signup_rate > 0) {
      return sorted[0];
    }
    return null;
  };

  const winner = getWinner();
  const maxViews = questionFunnel.length > 0 ? Math.max(...questionFunnel.map(f => f.views)) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">Question Variant A/B Test</h1>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Time period:</span>
          {[7, 14, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d} days
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Visitors</p>
              <p className="text-2xl font-bold">{data?.summary.totalUniqueVisitors || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Explore Views</p>
              <p className="text-2xl font-bold">
                {questionFunnel.reduce((acc, f) => acc + f.views, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Signups</p>
              <p className="text-2xl font-bold">
                {questionFunnel.reduce((acc, f) => acc + f.signups_completed, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Conversion</p>
              <p className="text-2xl font-bold">
                {questionFunnel.length > 0
                  ? (questionFunnel.reduce((acc, f) => acc + f.view_to_signup_rate, 0) / questionFunnel.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Winner Banner */}
      {winner && winner.views >= 10 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="font-semibold text-green-800">
                Winning Question: "{getVariantName(winner.variant)}"
              </p>
              <p className="text-sm text-green-600">
                {winner.view_to_signup_rate}% conversion rate ({winner.signups_completed} signups from {winner.views} views)
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {questionFunnel.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Variant Data Yet</h3>
          <p className="text-gray-600">
            Analytics will appear here once visitors start using the /explore page.
            The A/B test assigns visitors to one of four question variants.
          </p>
        </Card>
      )}

      {/* Conversion Funnel by Question Variant */}
      {questionFunnel.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Conversion by Question Variant</h2>

          <div className="space-y-6">
            {questionFunnel.map((variant) => {
              const colors = getVariantColors(variant.variant);
              const viewWidth = maxViews > 0 ? (variant.views / maxViews) * 100 : 0;

              return (
                <div key={variant.variant} className={`rounded-lg p-4 ${colors.bg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`font-semibold ${colors.text}`}>
                        {getVariantName(variant.variant)}
                      </h3>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">{variant.variant}</span>
                    </div>
                    <span className={`text-2xl font-bold ${colors.text}`}>
                      {variant.view_to_signup_rate}%
                    </span>
                  </div>

                  {/* Funnel visualization */}
                  <div className="space-y-2">
                    {/* Views */}
                    <div className="flex items-center">
                      <div className="w-32 text-sm text-gray-600">Views</div>
                      <div className="flex-1 h-8 bg-white rounded overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} flex items-center justify-end pr-2`}
                          style={{ width: `${viewWidth}%` }}
                        >
                          <span className="text-white text-sm font-medium">{variant.views}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signups Started */}
                    <div className="flex items-center">
                      <div className="w-32 text-sm text-gray-600">Started Signup</div>
                      <div className="flex-1 h-8 bg-white rounded overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} opacity-80 flex items-center justify-end pr-2`}
                          style={{ width: `${variant.views > 0 ? (variant.signups_started / variant.views) * viewWidth : 0}%` }}
                        >
                          <span className="text-white text-sm font-medium">{variant.signups_started}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signups Completed */}
                    <div className="flex items-center">
                      <div className="w-32 text-sm text-gray-600">Completed</div>
                      <div className="flex-1 h-8 bg-white rounded overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} opacity-60 flex items-center justify-end pr-2`}
                          style={{ width: `${variant.views > 0 ? (variant.signups_completed / variant.views) * viewWidth : 0}%` }}
                        >
                          <span className="text-white text-sm font-medium">{variant.signups_completed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Completed */}
                    <div className="flex items-center">
                      <div className="w-32 text-sm text-gray-600">Onboarded</div>
                      <div className="flex-1 h-8 bg-white rounded overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} opacity-40 flex items-center justify-end pr-2`}
                          style={{ width: `${variant.views > 0 ? (variant.onboarding_completed / variant.views) * viewWidth : 0}%` }}
                        >
                          <span className="text-white text-sm font-medium">{variant.onboarding_completed}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-500">View → Signup:</span>
                      <span className={`font-medium ml-1 ${colors.text}`}>{variant.view_to_signup_rate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start → Complete:</span>
                      <span className={`font-medium ml-1 ${colors.text}`}>{variant.signup_to_complete_rate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Test Link */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test the Explore Flow</h2>
        <div className="flex items-center gap-4">
          <a
            href="/explore"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <p className="font-medium text-indigo-700">Open /explore</p>
            <p className="text-xs text-indigo-500 mt-1">Visitors get randomly assigned a question variant</p>
          </a>
        </div>
      </Card>

      {/* Legacy Data Toggle */}
      {legacyFunnel.length > 0 && (
        <Card className="p-4">
          <button
            onClick={() => setShowLegacy(!showLegacy)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>{showLegacy ? '▼' : '▶'}</span>
            <span>Show archived landing page data ({legacyFunnel.length} variants)</span>
          </button>

          {showLegacy && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Legacy Landing Pages (Archived)</p>
              {legacyFunnel.map((variant) => {
                const colors = getVariantColors(variant.variant);
                return (
                  <div key={variant.variant} className={`rounded-lg p-3 ${colors.bg} opacity-60`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${colors.text}`}>{getVariantName(variant.variant)}</span>
                      <span className={`text-sm ${colors.text}`}>
                        {variant.views} views, {variant.view_to_signup_rate}% conversion
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
