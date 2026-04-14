'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, Link as LinkIcon, Clock, Code } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProjectRecommendation {
  id: string;
  title: string;
  description: string;
  why_matches: string;
  skills_learned: string[];
  difficulty: string;
  estimated_time: string;
  tech_stack: string[];
  first_step: string;
}

interface DataSource {
  id: string;
  name: string;
}

export default function DiscoverPage() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sourcePlatform, setSourcePlatform] = useState<string>('');
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('auto');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Fetch existing recommendations on mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/project-recommendations');
      if (response.ok) {
        const data = await response.json();
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setSourcePlatform(data.recommendations[0].source_platform);
          setHasGenerated(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    const loadingToast = toast.loading('Analyzing your interests and generating projects...');

    try {
      const response = await fetch('/api/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSource: selectedSource }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsConnection) {
          setError('Please connect at least one platform (Steam, Roblox, or Instagram) in your profile to get personalized recommendations.');
        } else if (data.availableSources) {
          setAvailableSources(data.availableSources);
          setError(data.error);
        } else {
          throw new Error(data.error || 'Failed to generate recommendations');
        }
        toast.dismiss(loadingToast);
        toast.error('Generation failed', { description: data.error });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success('Projects generated!', {
        description: `Found ${data.recommendations.length} perfect projects based on your ${data.source.platform} activity`,
      });

      setRecommendations(data.recommendations);
      setSourcePlatform(data.source.platform);
      setAvailableSources(data.availableSources || []);
      setHasGenerated(true);

      // Refresh the list
      await fetchRecommendations();
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.dismiss(loadingToast);
      toast.error('Something went wrong', {
        description: err.message || 'Please try again',
      });
      setError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Sparkles className="w-10 h-10 text-[#FF6B35]" />
          <h1 className="text-4xl font-bold">Discover Your Perfect Project</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered project recommendations based on your gaming and social media activity
        </p>
      </div>

      {/* Data Source Selector */}
      {availableSources.length > 1 && (
        <Card className="p-6 bg-[#2EC4B6]/10 border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-lg">Choose Data Source</h3>
                <p className="text-sm text-gray-600">
                  You have multiple connected platforms. Select which one to base recommendations on:
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedSource('auto')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSource === 'auto'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#FF6B35]/40'
                }`}
              >
                <div className="text-2xl mb-1">✨</div>
                <div className="font-medium text-sm">Auto</div>
                <div className="text-xs text-gray-600">Best available</div>
              </button>

              {availableSources.map((source) => {
                const icons: Record<string, string> = {
                  steam: '🎮',
                  roblox: '🧱',
                  instagram: '📸',
                };

                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSource === source.id
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-md'
                        : 'border-gray-200 bg-white hover:border-[#FF6B35]/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">{icons[source.id]}</div>
                    <div className="font-medium text-sm">{source.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Generate Button */}
      {!hasGenerated && (
        <Card className="p-8 text-center bg-[#FF6B35]/5 border-2 border-[#FF6B35]/30">
          <div className="space-y-4">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold">Ready to find your perfect project?</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Click below to get 5 personalized coding project recommendations based on your interests
            </p>
            {error && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={generateRecommendations}
              disabled={loading}
              size="lg"
              className="bg-[#FF6B35] hover:bg-[#E85A24]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Projects...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Projects
                </>
              )}
            </Button>
            {availableSources.length > 0 && (
              <p className="text-sm text-gray-500">
                Using data from: {selectedSource === 'auto' ? 'Best available' : availableSources.find(s => s.id === selectedSource)?.name}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Regenerate Button */}
      {hasGenerated && (
        <div className="flex justify-center">
          <Button
            onClick={generateRecommendations}
            disabled={loading}
            variant="outline"
            size="lg"
            className="border-2 border-[#FF6B35]/40 hover:bg-[#FF6B35]/5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate New Projects
                {selectedSource !== 'auto' && ` from ${availableSources.find(s => s.id === selectedSource)?.name}`}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Your Personalized Projects</h2>
            <p className="text-gray-600">
              Based on your {sourcePlatform} activity
            </p>
          </div>

          <div className="grid gap-6">
            {recommendations.map((project, index) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl font-bold text-[#FF6B35]">#{index + 1}</span>
                        <h3 className="text-xl font-bold">{project.title}</h3>
                      </div>
                      <p className="text-gray-700">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(project.difficulty)}`}>
                      {project.difficulty}
                    </span>
                  </div>

                  {/* Why This Matches */}
                  <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground mb-1">Why This Matches You:</p>
                        <p className="text-foreground text-sm">{project.why_matches}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Skills */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <p className="font-medium text-sm">You'll Learn:</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.skills_learned.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <LinkIcon className="w-4 h-4 text-green-600" />
                        <p className="font-medium text-sm">Tech Stack:</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <p className="font-medium text-sm">Time Estimate:</p>
                      </div>
                      <p className="text-sm text-gray-700">{project.estimated_time}</p>
                    </div>
                  </div>

                  {/* First Step */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-sm mb-1">🚀 First Step:</p>
                    <p className="text-sm text-gray-700">{project.first_step}</p>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" size="lg">
                    Start This Project
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasGenerated && !error && (
        <Card className="p-8 text-center border-2 border-dashed">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-4">
            Connect your gaming or social media accounts to get started
          </p>
          <Link href="/dashboard/profile">
            <Button variant="outline">
              Go to Profile Settings
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}