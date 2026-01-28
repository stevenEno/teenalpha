'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Upload,
  Sparkles,
  TrendingUp,
  UserPlus,
  Settings,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Instagram,
  Gamepad2,
} from 'lucide-react';

interface AdminStats {
  users: {
    teen: number;
    mentor: number;
    parent: number;
    admin: number;
    total: number;
  };
  projects: {
    active: number;
    completed: number;
    paused: number;
    total: number;
  };
  sessions: {
    scheduled: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  payments: {
    totalRevenue: number;
    successfulPayments: number;
    pendingPayments: number;
  };
  socialUploads: {
    instagram: number;
    tiktok: number;
    snapchat: number;
    steam: number;
    total: number;
  };
  pathwaysGenerated: number;
  abTest: {
    totalViews: number;
    signupsStarted: number;
    signupsCompleted: number;
    byVariant: Record<string, { views: number; signups: number }>;
  };
  recentUsers: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
  pendingMentorRecs: number;
}

const VARIANT_NAMES: Record<string, string> = {
  'screen-time': 'Screen Time',
  'grow': 'Grow',
  'leapfrog': 'Leapfrog',
  'purpose': 'Purpose',
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchStats} className="mt-4">
          Try Again
        </Button>
      </main>
    );
  }

  const conversionRate = stats?.abTest.totalViews
    ? ((stats.abTest.signupsCompleted / stats.abTest.totalViews) * 100).toFixed(1)
    : '0';

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of Teen Alpha platform</p>
        </div>
        <Button variant="outline" onClick={fetchStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/analytics">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium">A/B Analytics</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/prompts">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">Manage Prompts</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/mentor-recommendations">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium">Mentor Recs</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            {(stats?.pendingMentorRecs || 0) > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {stats?.pendingMentorRecs}
              </span>
            )}
          </Card>
        </Link>

        <Link href="/dashboard/profile/data">
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-medium">Data Analysis</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold">{stats?.users.total || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-semibold text-blue-600">{stats?.users.teen || 0}</p>
              <p className="text-gray-500">Teens</p>
            </div>
            <div>
              <p className="font-semibold text-purple-600">{stats?.users.mentor || 0}</p>
              <p className="text-gray-500">Mentors</p>
            </div>
            <div>
              <p className="font-semibold text-green-600">{stats?.users.parent || 0}</p>
              <p className="text-gray-500">Parents</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Projects</p>
              <p className="text-3xl font-bold">{stats?.projects.total || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-semibold text-green-600">{stats?.projects.active || 0}</p>
              <p className="text-gray-500">Active</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">{stats?.projects.completed || 0}</p>
              <p className="text-gray-500">Done</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">{stats?.projects.paused || 0}</p>
              <p className="text-gray-500">Paused</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-3xl font-bold">{stats?.sessions.total || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-semibold text-amber-600">{stats?.sessions.scheduled || 0}</p>
              <p className="text-gray-500">Scheduled</p>
            </div>
            <div>
              <p className="font-semibold text-green-600">{stats?.sessions.completed || 0}</p>
              <p className="text-gray-500">Completed</p>
            </div>
            <div>
              <p className="font-semibold text-red-600">{stats?.sessions.cancelled || 0}</p>
              <p className="text-gray-500">Cancelled</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-3xl font-bold">
                ${((stats?.payments.totalRevenue || 0) / 100).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Successful payments</span>
              <span className="font-semibold">{stats?.payments.successfulPayments || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Landing Page Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Landing Page Performance</h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats?.abTest.totalViews || 0}</p>
              <p className="text-sm text-gray-500">Page Views</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.abTest.signupsCompleted || 0}</p>
              <p className="text-sm text-gray-500">Signups</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
              <p className="text-sm text-gray-500">Conversion</p>
            </div>
          </div>

          {/* Variant Performance */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">By Variant</p>
            {Object.entries(stats?.abTest.byVariant || {}).map(([variant, data]) => {
              const rate = data.views > 0 ? ((data.signups / data.views) * 100).toFixed(1) : '0';
              return (
                <div key={variant} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{VARIANT_NAMES[variant] || variant}</span>
                  <div className="text-sm text-right">
                    <span className="text-gray-600">{data.views} views</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-green-600 font-medium">{rate}% conv</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats?.abTest.byVariant || {}).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No landing page data yet</p>
            )}
          </div>

          <Link href="/admin/analytics" className="block mt-4">
            <Button variant="outline" className="w-full">
              View Detailed Analytics
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        {/* Social Data & Engagement */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Social Data & Engagement</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
              <div className="flex items-center space-x-3">
                <Instagram className="w-6 h-6 text-pink-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.socialUploads.instagram || 0}</p>
                  <p className="text-sm text-gray-600">Instagram uploads</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Gamepad2 className="w-6 h-6 text-gray-700" />
                <div>
                  <p className="text-2xl font-bold">{stats?.socialUploads.steam || 0}</p>
                  <p className="text-sm text-gray-600">Steam connections</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-medium">Startup Pathways Generated</p>
                  <p className="text-sm text-gray-600">AI-powered career recommendations</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats?.pathwaysGenerated || 0}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-center space-x-3">
                <Upload className="w-6 h-6 text-cyan-600" />
                <div>
                  <p className="font-medium">Total Data Uploads</p>
                  <p className="text-sm text-gray-600">All platforms combined</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-cyan-600">{stats?.socialUploads.total || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Signups</h2>
          <span className="text-sm text-gray-500">Last 7 days</span>
        </div>

        {(stats?.recentUsers?.length || 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats?.recentUsers?.map((user) => (
                  <tr key={user.id} className="text-sm">
                    <td className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium">{user.full_name || 'No name'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'teen' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'mentor' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'parent' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No new signups in the last 7 days</p>
          </div>
        )}
      </Card>
    </main>
  );
}
