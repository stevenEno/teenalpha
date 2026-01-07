'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ProjectRecommendation {
  title: string;
  description: string;
  category: string;
  inspirationGame: string;
  skillsLearned: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

interface GamingProfile {
  totalHours: number;
  topGames: Array<{ name: string; hours: number }>;
  genres: string[];
}

export function ProjectRecommendations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [gamingProfile, setGamingProfile] = useState<GamingProfile | null>(null);
  const [creatingProject, setCreatingProject] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations');
      }

      setRecommendations(data.recommendations);
      setGamingProfile(data.gamingProfile);
    } catch (err: any) {
      console.error('Recommendation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = async (recommendation: ProjectRecommendation) => {
    setCreatingProject(recommendation.title);
    const loadingToast = toast.loading('Creating your project...');

    try {
      // Generate tasks for this project using AI
      const tasksResponse = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recommendation.title,
          description: recommendation.description,
          category: recommendation.category,
        }),
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to generate project tasks');
      }

      const { data: aiData } = await tasksResponse.json();

      // Store in session storage for review page
      sessionStorage.setItem('pendingProject', JSON.stringify({
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category,
        userId: 'current-user', // Will be filled by review page
        aiData,
        fromRecommendation: true,
        inspirationGame: recommendation.inspirationGame,
      }));

      toast.dismiss(loadingToast);
      toast.success('Project ready!', {
        description: 'Review your AI-generated tasks',
      });

      router.push('/projects/review');
    } catch (err: any) {
      console.error('Project creation error:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to create project', {
        description: err.message,
      });
    } finally {
      setCreatingProject(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Gaming Profile Skeleton */}
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </Card>

        {/* Recommendations Skeleton */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            className="ml-4"
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gaming Profile Summary */}
      {gamingProfile && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Gaming Profile
              </h2>
              <p className="text-gray-700">
                You've played <strong>{gamingProfile.totalHours.toLocaleString()} hours</strong> across{' '}
                <strong>{gamingProfile.topGames.length} games</strong>
              </p>
            </div>
            <div className="text-5xl">🎮</div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Top Games:</p>
              <div className="flex flex-wrap gap-2">
                {gamingProfile.topGames.slice(0, 5).map((game, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {game.name} ({game.hours}h)
                  </Badge>
                ))}
              </div>
            </div>

            {gamingProfile.genres.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Favorite Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {gamingProfile.genres.map((genre, idx) => (
                    <Badge key={idx} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Magic Moment Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ✨ Projects Made For You
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Based on the games you love, here are projects that will feel exciting and
          teach you real skills.
        </p>
      </div>

      {/* Project Recommendations */}
      <div className="space-y-6">
        {recommendations.map((rec, idx) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {rec.title}
                  </h3>
                  <Badge
                    variant={
                      rec.difficulty === 'beginner'
                        ? 'default'
                        : rec.difficulty === 'intermediate'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {rec.difficulty}
                  </Badge>
                </div>
                <p className="text-blue-600 font-medium text-sm mb-3">
                  💡 Inspired by: {rec.inspirationGame}
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {rec.description}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Skills You'll Learn:
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.skillsLearned.map((skill, skillIdx) => (
                    <Badge key={skillIdx} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📊 Category: {rec.category}</span>
                <span>⏱️ ~{rec.estimatedHours} hours</span>
              </div>
            </div>

            <Button
              onClick={() => handleStartProject(rec)}
              disabled={!!creatingProject}
              size="lg"
              className="w-full"
            >
              {creatingProject === rec.title
                ? 'Creating Project...'
                : 'Start This Project →'}
            </Button>
          </Card>
        ))}
      </div>

      {/* Regenerate Button */}
      <div className="text-center py-6">
        <Button
          variant="outline"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          🔄 Generate New Recommendations
        </Button>
      </div>
    </div>
  );
}