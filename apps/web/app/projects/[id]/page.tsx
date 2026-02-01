import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AddTaskButton } from '@/components/projects/AddTaskButton';
import { ProjectPageClient } from '@/components/projects/ProjectPageClient';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { AlphaBar } from '@/components/incentives/AlphaBar';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  // Await params (required in Next.js 15)
  const { id } = await params;
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // No-op in server components
        },
        remove(name: string, options: any) {
          // No-op in server components
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get the project with its tasks
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks (
        id,
        title,
        description,
        status,
        order_index,
        evidence_url,
        evidence_type,
        evidence_description,
        suggested_evidence,
        ai_generated,
        created_at,
        completed_at
      )
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
    console.error('Error fetching project:', error);
    redirect('/projects');
  }

  // Check if user has access to this project
  const isProjectOwner = project.teen_id === user.id;

  // Check if user is a mentor of the project owner
  let isMentorOfOwner = false;
  if (profile.role === 'mentor') {
    const { data: mentorship } = await supabase
      .from('mentorships')
      .select('id')
      .eq('mentor_id', user.id)
      .eq('teen_id', project.teen_id)
      .eq('status', 'active')
      .single();

    isMentorOfOwner = !!mentorship;
  }

  // Only allow access if owner or mentor
  if (!isProjectOwner && !isMentorOfOwner && profile.role !== 'admin') {
    redirect('/projects');
  }

  // Sort tasks by order_index
  const tasks = (project.tasks || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                ← Back to Projects
              </Button>
            </Link>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.title}
              </h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge
                variant={
                  project.status === 'active'
                    ? 'default'
                    : project.status === 'completed'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {project.status}
              </Badge>
              {project.category && (
                <Badge variant="outline">{project.category}</Badge>
              )}
            </div>
          </div>

          {/* Compact Alpha Bar */}
          {isProjectOwner && <AlphaBar compact />}

          {project.ai_generated && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                ✨ This project was created with AI assistance
              </p>
            </div>
          )}

          {/* Add Task Button */}
          <div className="flex items-center justify-end">
            <AddTaskButton projectId={id} taskCount={tasks.length} />
          </div>
        </div>

        {/* Client-side Kanban Board and Stats */}
        <ProjectPageClient
          projectId={id}
          projectTitle={project.title}
          initialTasks={tasks}
        />

        {/* Comments Section */}
        <div className="mt-6">
          <CommentsSection
            projectId={id}
            currentUserId={user.id}
            currentUserRole={profile.role}
          />
        </div>
      </main>
    </div>
  );
}