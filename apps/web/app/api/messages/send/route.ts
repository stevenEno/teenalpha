import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CHAT_STREAK_ALPHA, CHAT_STREAK_MILESTONES } from '@/lib/incentives';

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
    const { chatId, content, type, mediaUrl, stickerKey } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }

    const messageType = type || 'text';
    if (!['text', 'image', 'voice', 'video', 'sticker'].includes(messageType)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    if (messageType === 'text' && (!content || !content.trim())) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
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

    // Set expiry (24 hours from now for ephemeral messages)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Determine message content
    let messageContent = content?.trim() || null;
    let messageMediaUrl = mediaUrl || null;

    if (messageType === 'sticker') {
      messageContent = stickerKey || content;
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: messageContent,
        message_type: messageType,
        media_url: messageMediaUrl,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Message send error:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update sender's last_read_at
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    // Update chat streak (for one-on-one chats)
    let streakUpdate = null;
    let alphaEarned = 0;
    const { data: chat } = await supabase
      .from('chats')
      .select('chat_type')
      .eq('id', chatId)
      .single();

    if (chat?.chat_type === 'one-on-one') {
      const today = new Date().toISOString().split('T')[0];

      const { data: streak } = await supabase
        .from('chat_streaks')
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (streak) {
        let newCount = streak.streak_count;

        if (streak.last_message_date !== today) {
          const lastDate = streak.last_message_date ? new Date(streak.last_message_date) : null;
          const todayDate = new Date(today);

          if (lastDate) {
            const diffDays = Math.floor(
              (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) {
              newCount = streak.streak_count + 1;
              alphaEarned = CHAT_STREAK_ALPHA;

              // Check for milestone bonuses
              const milestone = CHAT_STREAK_MILESTONES[newCount];
              if (milestone) {
                alphaEarned += milestone;
              }
            } else if (diffDays > 1) {
              newCount = 1; // Streak broken, restart
            }
          } else {
            newCount = 1; // First message
          }

          const { data: updated } = await supabase
            .from('chat_streaks')
            .update({
              streak_count: newCount,
              last_message_date: today,
              longest_streak: Math.max(newCount, streak.longest_streak),
            })
            .eq('chat_id', chatId)
            .select()
            .single();

          streakUpdate = updated;
        }
      }

      // Log streak Alpha if earned
      if (alphaEarned > 0) {
        await supabase.from('incentive_events').insert({
          user_id: user.id,
          system: 'quest',
          event_type: 'chat_streak',
          metadata: { chatId, alphaEarned, streakCount: streakUpdate?.streak_count },
        });
      }
    }

    return NextResponse.json({
      message,
      streak: streakUpdate,
      alphaEarned,
    });
  } catch (error: any) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
