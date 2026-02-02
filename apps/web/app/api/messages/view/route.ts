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
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    // Get the message
    const { data: message } = await supabase
      .from('messages')
      .select('*, chats:chat_id (chat_type)')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Don't mark own messages as viewed
    if (message.sender_id === user.id) {
      return NextResponse.json({ success: true });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', message.chat_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Mark as viewed
    if (!message.viewed_at) {
      await supabase
        .from('messages')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', messageId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Message view error:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark as viewed' }, { status: 500 });
  }
}
