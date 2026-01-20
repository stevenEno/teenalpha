import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function MentorRecommendationsAdmin() {
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

  // Get all recommendations with parent info
  const { data: recommendations } = await supabase
    .from('mentor_recommendations')
    .select(`
      *,
      recommender:recommended_by (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mentor Recommendations</h1>
        <p className="text-gray-600">Review and manage mentor recommendations from parents</p>
      </div>

      <div className="grid gap-4">
        {recommendations?.map((rec) => (
          <Card key={rec.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    
                    <a href={rec.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn Profile →
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Username: @{rec.linkedin_username}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  rec.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                  rec.status === 'joined' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rec.status}
                </span>
              </div>

              {rec.recommendation_message && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{rec.recommendation_message}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-gray-600">
                  Recommended by: {(rec.recommender as any)?.full_name || 'Unknown'} ({(rec.recommender as any)?.email})
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">
                    Mark as Contacted
                  </Button>
                  <Button size="sm">
                    Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}