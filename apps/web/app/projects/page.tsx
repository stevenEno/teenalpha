import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function ProjectsPage() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status)')
    .eq('teen_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-2">
              Track your progress and keep building
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="lg">+ New Project</Button>
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first project and start building something amazing!
            </p>
            <Link href="/projects/new">
              <Button size="lg">Create Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const tasks = project.tasks || [];
              const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
              const progress = tasks.length > 0 
                ? Math.round((completedTasks / tasks.length) * 100)
                : 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </h3>
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
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {project.description}
                    </p>

                    {project.category && (
                      <Badge variant="outline" className="mb-4">
                        {project.category}
                      </Badge>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {completedTasks} / {tasks.length} tasks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}