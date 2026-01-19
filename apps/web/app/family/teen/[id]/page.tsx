import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TeenPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeenDetailPage({ params }: TeenPageProps) {
  const { id: teenId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    redirect('/dashboard');
  }

  // Verify parent has a verified connection to this teen
  const { data: connection } = await supabase
    .from('family_connections')
    .select('*')
    .eq('parent_id', user.id)
    .eq('teen_id', teenId)
    .eq('verified', true)
    .single();

  if (!connection) {
    notFound();
  }

  // Get the teen's profile
  const { data: teen } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', teenId)
    .single();

  if (!teen) {
    notFound();
  }

  // Get teen's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('teen_id', teenId)
    .order('created_at', { ascending: false });

  // Get teen's mentors
  const { data: mentorships } = await supabase
    .from('mentorships')
    .select(`
      *,
      mentor:mentor_id (
        id,
        full_name,
        avatar_url,
        expertise,
        bio,
        is_default_mentor
      )
    `)
    .eq('teen_id', teenId)
    .eq('status', 'active');

  // Get teen's social media analysis
  const { data: socialAnalyses } = await supabase
    .from('social_media_analysis')
    .select('*')
    .eq('profile_id', teenId);

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];

  const initials = teen.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'T';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          ← Back to Dashboard
        </Link>

        {/* Teen Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-200 flex items-center justify-center">
              {teen.avatar_url ? (
                <img
                  src={teen.avatar_url}
                  alt={teen.full_name || 'Teen'}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-600">{initials}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{teen.full_name || 'Teen'}</h1>
              <div className="flex items-center gap-3 text-gray-600">
                {teen.grade && <span>Grade {teen.grade}</span>}
                {teen.school && <span>• {teen.school}</span>}
              </div>
              {teen.bio && (
                <p className="text-gray-500 mt-2">{teen.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h4>
            <p className="text-3xl font-bold text-blue-600">{activeProjects.length}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Completed</h4>
            <p className="text-3xl font-bold text-green-600">{completedProjects.length}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Mentors</h4>
            <p className="text-3xl font-bold text-purple-600">{mentorships?.length || 0}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Tasks Done</h4>
            <p className="text-3xl font-bold text-orange-600">
              {projects?.reduce((acc, p) => acc + (p.tasks?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Projects</h2>

              {projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const totalTasks = project.tasks?.length || 0;
                    const completedTasks = project.tasks?.filter((t: any) => t.status === 'done')?.length || 0;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <div key={project.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{project.title}</h3>
                              <Badge
                                className={
                                  project.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : project.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {project.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {completedTasks} of {totalTasks} tasks completed
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No projects yet.</p>
                  <p className="text-sm mt-1">
                    Your teen hasn't started any projects.
                  </p>
                </div>
              )}
            </Card>

            {/* Social Media Insights */}
            {socialAnalyses && socialAnalyses.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Interest Insights</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Based on their connected social media accounts
                </p>

                {socialAnalyses.map((analysis: any) => (
                  <div key={analysis.id} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="capitalize">
                        {analysis.platform}
                      </Badge>
                      {analysis.created_at && (
                        <span className="text-xs text-gray-400">
                          Connected {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Top Interests */}
                    {analysis.top_interests && analysis.top_interests.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Top Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.top_interests.map((interest: string, i: number) => (
                            <Badge key={i} className="bg-purple-100 text-purple-800">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Themes */}
                    {analysis.content_themes && analysis.content_themes.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Content Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.content_themes.map((theme: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Skills */}
                    {analysis.suggested_skills && analysis.suggested_skills.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Skills to Develop</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.suggested_skills.map((skill: string, i: number) => (
                            <Badge key={i} className="bg-blue-100 text-blue-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personality Insights */}
                    {analysis.analysis?.personalityInsights && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">AI Insights</h4>
                        <p className="text-sm text-gray-600">{analysis.analysis.personalityInsights}</p>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Sidebar - Mentors */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Mentors</h2>

              {mentorships && mentorships.length > 0 ? (
                <div className="space-y-4">
                  {mentorships.map((m: any) => (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.mentor.is_default_mentor
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {m.mentor.avatar_url ? (
                          <img
                            src={m.mentor.avatar_url}
                            alt={m.mentor.full_name || 'Mentor'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-medium">
                            {m.mentor.full_name?.charAt(0) || 'M'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{m.mentor.full_name}</p>
                          {m.mentor.is_default_mentor && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Founding
                            </Badge>
                          )}
                        </div>
                        {m.mentor.expertise && m.mentor.expertise.length > 0 && (
                          <p className="text-xs text-gray-500 truncate">
                            {m.mentor.expertise.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No mentors assigned yet.</p>
                </div>
              )}
            </Card>

            {/* Connection Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Connection Info</h3>
              <p className="text-sm text-gray-600">
                Connected since {new Date(connection.verified_at || connection.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Relationship: {connection.relationship || 'Parent'}
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
