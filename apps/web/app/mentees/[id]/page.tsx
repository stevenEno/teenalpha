import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MenteePageProps {
  params: Promise<{ id: string }>;
}

export default async function MenteePage({ params }: MenteePageProps) {
  const { id: menteeId } = await params;

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

  if (!profile || profile.role !== 'mentor') {
    redirect('/dashboard');
  }

  // Verify this is the mentor's mentee
  const { data: mentorship } = await supabase
    .from('mentorships')
    .select('*')
    .eq('mentor_id', user.id)
    .eq('teen_id', menteeId)
    .single();

  if (!mentorship) {
    notFound();
  }

  // Get the mentee's profile
  const { data: mentee } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', menteeId)
    .single();

  if (!mentee) {
    notFound();
  }

  // Get mentee's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('teen_id', menteeId)
    .order('created_at', { ascending: false });

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];

  const initials = mentee.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'T';

  return (
    <div className="min-h-screen bg-background">
      <Header profile={profile} />
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          ← Back to Dashboard
        </Link>

        {/* Mentee Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#FF6B35]/10 border-2 border-[#FF6B35]/30 flex items-center justify-center">
            {mentee.avatar_url ? (
              <img
                src={mentee.avatar_url}
                alt={mentee.full_name || 'Mentee'}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-blue-600">{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{mentee.full_name || 'Teen'}</h1>
            <div className="flex items-center gap-3 text-gray-600">
              {mentee.grade && <span>Grade {mentee.grade}</span>}
              {mentee.school && <span>• {mentee.school}</span>}
            </div>
            {mentee.bio && (
              <p className="text-gray-500 mt-2">{mentee.bio}</p>
            )}
            <div className="mt-3">
              <Badge className="bg-green-100 text-green-800">
                Mentee since {new Date(mentorship.created_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Active Projects</h4>
            <p className="text-3xl font-bold text-blue-600">{activeProjects.length}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Completed Projects</h4>
            <p className="text-3xl font-bold text-green-600">{completedProjects.length}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Tasks Done</h4>
            <p className="text-3xl font-bold text-[#FF6B35]">
              {projects?.reduce((acc, p) => acc + (p.tasks?.filter((t: any) => t.status === 'done')?.length || 0), 0) || 0}
            </p>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Projects</h2>

          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => {
                const totalTasks = project.tasks?.length || 0;
                const completedTasks = project.tasks?.filter((t: any) => t.status === 'done')?.length || 0;
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <Card key={project.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{project.title}</h3>
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
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {completedTasks} of {totalTasks} tasks completed
                          </p>
                        </div>
                      </div>

                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500">No projects yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Encourage {mentee.full_name || 'this student'} to start a project!
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
