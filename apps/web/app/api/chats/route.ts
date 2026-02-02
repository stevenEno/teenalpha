import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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

    // Verify teen role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teen') {
      return NextResponse.json({ error: 'Only teens can access messages' }, { status: 403 });
    }

    // Get user's chat IDs
    const { data: participations } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      return NextResponse.json({ chats: [] });
    }

    const chatIds = participations.map(p => p.chat_id);

    // Get chats with participants and streaks
    const { data: chats } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds)
      .order('created_at', { ascending: false });

    if (!chats || chats.length === 0) {
      return NextResponse.json({ chats: [] });
    }

    // Get all participants for these chats with profiles
    const { data: allParticipants } = await supabase
      .from('chat_participants')
      .select('*, profiles:user_id (full_name, avatar_url)')
      .in('chat_id', chatIds);

    // Get streaks
    const { data: streaks } = await supabase
      .from('chat_streaks')
      .select('*')
      .in('chat_id', chatIds);

    // Get last message per chat + unread count
    const chatPreviews = await Promise.all(
      chats.map(async (chat) => {
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const myParticipation = allParticipants?.find(
          p => p.chat_id === chat.id && p.user_id === user.id
        );

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', user.id)
          .gt('created_at', myParticipation?.last_read_at || '1970-01-01');

        return {
          ...chat,
          participants: allParticipants?.filter(p => p.chat_id === chat.id) || [],
          last_message: lastMessages?.[0] || null,
          streak: streaks?.find(s => s.chat_id === chat.id) || null,
          unread_count: unreadCount || 0,
        };
      })
    );

    // Sort by last message time
    chatPreviews.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ chats: chatPreviews });
  } catch (error: any) {
    console.error('Chats list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chats' }, { status: 500 });
  }
}
