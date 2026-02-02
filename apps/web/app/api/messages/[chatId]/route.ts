import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
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

    // Fetch messages (exclude expired unsaved ones)
    const now = new Date().toISOString();
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .or(`expires_at.is.null,expires_at.gt.${now},saved.eq.true`)
      .order('created_at', { ascending: true });

    // Get chat info
    const { data: chat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    // Get participants with profiles
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('*, profiles:user_id (full_name, avatar_url)')
      .eq('chat_id', chatId);

    // Get streak
    const { data: streak } = await supabase
      .from('chat_streaks')
      .select('*')
      .eq('chat_id', chatId)
      .single();

    // Update last_read_at for current user
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    return NextResponse.json({
      chat,
      messages: messages || [],
      participants: participants || [],
      streak: streak || null,
    });
  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}
