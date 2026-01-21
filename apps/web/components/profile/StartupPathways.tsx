'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronUp, RefreshCw, Rocket, ExternalLink, Sparkles, Check } from 'lucide-react';

interface Startup {
  name: string;
  description: string;
  website: string;
}

interface Pathway {
  name: string;
  icon: string;
  connection: string;
  startups: Startup[];
  skills: string[];
  firstSteps: string[];
}

interface StudentInterests {
  topInterests: string[];
  contentThemes: string[];
  categories: Record<string, number>;
  platform: string;
}

interface TBPNEpisode {
  title: string;
  description: string;
  themes: string[];
  pubDate: string;
}

interface PathwaysData {
  id: string;
  profile_id: string;
  student_interests: StudentInterests;
  tbpn_episodes: TBPNEpisode[];
  pathways: Pathway[];
  created_at: string;
  updated_at: string;
}

interface StartupPathwaysProps {
  isAdmin?: boolean;
}

export function StartupPathways({ isAdmin = false }: StartupPathwaysProps) {
  const router = useRouter();
  const [data, setData] = useState<PathwaysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [choosingPathway, setChoosingPathway] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    fetchPathways();
  }, []);

  const fetchPathways = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/startup-pathways');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pathways');
      }

      setData(result.pathways);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePathways = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/startup-pathways', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate pathways');
      }

      setData(result.pathways);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const choosePathway = async (pathwayIndex: number) => {
    if (!data) return;

    const pathway = data.pathways[pathwayIndex];
    setChoosingPathway(pathwayIndex);
    setError(null);

    try {
      const response = await fetch('/api/startup-pathways/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathwayId: data.id,
          pathwayIndex,
          pathway,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Redirect to the new project
      router.push(`/projects/${result.project.id}`);
    } catch (err: any) {
      setError(err.message);
      setChoosingPathway(null);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden border-2 border-indigo-200 bg-indigo-50">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-indigo-200 rounded w-1/3"></div>
            <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-indigo-200 bg-indigo-50">
      {/* Header */}
      <div className="p-6 border-b border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl"><Rocket className="w-8 h-8 text-indigo-600" /></span>
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">Startup Pathways</h2>
              <p className="text-sm text-indigo-700">
                AI-powered career paths based on your interests
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={generatePathways}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : data ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Pathways
                </>
              )}
            </Button>
            {data && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {data && (
          <p className="text-xs text-indigo-600 mt-2">
            Last generated: {new Date(data.created_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* No Data State */}
      {!data && !error && !generating && (
        <div className="p-6">
          <div className="text-center py-8">
            <Rocket className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              Discover Your Startup Path
            </h3>
            <p className="text-indigo-700 mb-4 max-w-md mx-auto">
              We'll analyze your interests and use AI to create personalized career
              pathways connecting you to exciting opportunities in tech and startups.
            </p>
            <Button
              onClick={generatePathways}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Startup Pathways
            </Button>
          </div>
        </div>
      )}

      {/* Pathways Display */}
      {data && expanded && (
        <div className="p-6 space-y-6">
          {/* Pathway Cards */}
          <div className="grid gap-6">
            {data.pathways.map((pathway, index) => (
              <PathwayCard
                key={index}
                pathway={pathway}
                index={index}
                onChoose={() => choosePathway(index)}
                isChoosing={choosingPathway === index}
                disabled={choosingPathway !== null}
              />
            ))}
          </div>

          {/* Sources Section - Only show interests to regular users, episodes only to admins */}
          <div className="border-t border-indigo-200 pt-4">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center text-sm text-indigo-700 hover:text-indigo-900"
            >
              {showSources ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {showSources ? 'Hide' : 'Show'} your interests used
            </button>

            {showSources && (
              <div className="mt-4 space-y-4">
                {/* Student Interests Used */}
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-sm text-indigo-900 mb-2">
                    Your Interests ({data.student_interests.platform})
                  </h4>
                  <div className="space-y-2 text-sm">
                    {data.student_interests.topInterests.length > 0 && (
                      <div>
                        <span className="text-indigo-600 font-medium">Top Interests: </span>
                        <span className="text-gray-700">{data.student_interests.topInterests.join(', ')}</span>
                      </div>
                    )}
                    {data.student_interests.contentThemes.length > 0 && (
                      <div>
                        <span className="text-indigo-600 font-medium">Content Themes: </span>
                        <span className="text-gray-700">{data.student_interests.contentThemes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TBPN Episodes Used - ADMIN ONLY */}
                {isAdmin && data.tbpn_episodes && data.tbpn_episodes.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-sm text-yellow-900 mb-2">
                      [Admin] Podcast Episodes Analyzed ({data.tbpn_episodes.length})
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {data.tbpn_episodes.slice(0, 5).map((episode, i) => (
                        <li key={i} className="text-gray-700">
                          <span className="font-medium">{episode.title}</span>
                          {episode.themes.length > 0 && (
                            <span className="text-yellow-600 text-xs ml-2">
                              ({episode.themes.join(', ')})
                            </span>
                          )}
                        </li>
                      ))}
                      {data.tbpn_episodes.length > 5 && (
                        <li className="text-yellow-600 text-xs">
                          + {data.tbpn_episodes.length - 5} more episodes
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

interface PathwayCardProps {
  pathway: Pathway;
  index: number;
  onChoose: () => void;
  isChoosing: boolean;
  disabled: boolean;
}

function PathwayCard({ pathway, index, onChoose, isChoosing, disabled }: PathwayCardProps) {
  const [expanded, setExpanded] = useState(index === 0); // First one expanded by default

  const bgColors = [
    'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200',
    'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200',
    'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
  ];

  const accentColors = [
    { text: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
    { text: 'text-cyan-700', bg: 'bg-cyan-100', border: 'border-cyan-200' },
    { text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  ];

  const colors = accentColors[index % 3];

  return (
    <div className={`rounded-lg border-2 ${bgColors[index % 3]} overflow-hidden`}>
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{pathway.icon || '🚀'}</span>
          <h3 className="font-bold text-lg text-gray-900">{pathway.name}</h3>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Card Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Connection */}
          <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
            <h4 className={`text-xs font-semibold uppercase ${colors.text} mb-1`}>
              Your Interest → Opportunity
            </h4>
            <p className="text-sm text-gray-700">{pathway.connection}</p>
          </div>

          {/* Startups */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Top Startups</h4>
            <div className="space-y-2">
              {pathway.startups.map((startup, i) => (
                <div key={i} className="flex items-start justify-between bg-white p-2 rounded border">
                  <div className="flex-1">
                    <span className="font-medium text-sm text-gray-900">{startup.name}</span>
                    <p className="text-xs text-gray-600">{startup.description}</p>
                  </div>
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-indigo-500 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Skills to Build</h4>
            <div className="flex flex-wrap gap-1">
              {pathway.skills.map((skill, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* First Steps */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">First Steps</h4>
            <ol className="space-y-1">
              {pathway.firstSteps.map((step, i) => (
                <li key={i} className="flex items-start text-sm">
                  <span className={`font-bold ${colors.text} mr-2`}>{i + 1}.</span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Choose This Pathway Button */}
          <div className="pt-2 border-t border-gray-200">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onChoose();
              }}
              disabled={disabled}
              className={`w-full ${colors.bg} ${colors.text} hover:opacity-90 border ${colors.border}`}
              variant="outline"
            >
              {isChoosing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Your Project...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Choose This Pathway
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              This will create a project with these first steps as tasks
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
