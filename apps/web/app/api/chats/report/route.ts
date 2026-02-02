import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, reason } = body;

    if (!chatId || !reason) {
      return NextResponse.json({ error: 'Missing chatId or reason' }, { status: 400 });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant of this chat' }, { status: 403 });
    }

    const { error } = await supabase
      .from('chat_reports')
      .insert({
        chat_id: chatId,
        reporter_id: user.id,
        reason,
      });

    if (error) {
      console.error('Chat report error:', error);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Report submitted' });
  } catch (error: any) {
    console.error('Chat report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to report' }, { status: 500 });
  }
}
