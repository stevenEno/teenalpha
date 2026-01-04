import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  // Sort tasks by order_index
  const tasks = (project.tasks || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  const todoTasks = tasks.filter((t: any) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t: any) => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    ← Back to Projects
                  </Button>
                </Link>
              </div>
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

          {project.ai_generated && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <p className="text-sm text-blue-800">
                ✨ This project was created with AI assistance
              </p>
            </div>
          )}

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{todoTasks.length}</p>
              <p className="text-sm text-gray-600">To Do</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{doneTasks.length}</p>
              <p className="text-sm text-gray-600">Done</p>
            </div>
          </div>
        </div>

        {/* Simple Task List (we'll make this a Kanban board later) */}
        <div className="space-y-6">
          {/* To Do Column */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
              To Do ({todoTasks.length})
            </h2>
            {todoTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks to do</p>
            ) : (
              <div className="space-y-3">
                {todoTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {task.description}
                    </p>
                    {task.suggested_evidence && (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          💡 Suggested Evidence:
                        </p>
                        <p className="text-xs text-gray-600">
                          {task.suggested_evidence}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              In Progress ({inProgressTasks.length})
            </h2>
            {inProgressTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks in progress</p>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="border border-blue-200 rounded-lg p-4 bg-blue-50"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {task.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Done Column */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Done ({doneTasks.length})
            </h2>
            {doneTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No completed tasks yet</p>
            ) : (
              <div className="space-y-3">
                {doneTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="border border-green-200 rounded-lg p-4 bg-green-50"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {task.description}
                    </p>
                    {task.evidence_url && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          ✓ Evidence uploaded
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}