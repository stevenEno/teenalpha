import { createClient } from '@supabase/supabase-js';

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function emitActivityEvent(params: {
  actorId: string;
  actorRole: string;
  eventType: 'pathway_complete' | 'evidence_submitted' | 'project_complete' | 'streak_milestone';
  title: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await admin().from('activity_events').insert({
      actor_id: params.actorId,
      actor_role: params.actorRole,
      event_type: params.eventType,
      title: params.title,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error('Failed to emit activity event:', err);
  }
}
