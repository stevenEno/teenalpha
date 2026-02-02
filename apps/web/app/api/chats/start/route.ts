import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MAX_GROUP_SIZE = 6;

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

    // Verify teen role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teen') {
      return NextResponse.json({ error: 'Only teens can start chats' }, { status: 403 });
    }

    const body = await request.json();
    const { type, participants, name } = body;

    if (!type || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: 'Missing type or participants' }, { status: 400 });
    }

    if (type !== 'one-on-one' && type !== 'group') {
      return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
    }

    // Validate participant count
    const allParticipants = [...new Set([user.id, ...participants])];
    if (type === 'one-on-one' && allParticipants.length !== 2) {
      return NextResponse.json({ error: 'One-on-one chats need exactly 2 participants' }, { status: 400 });
    }

    if (type === 'group' && allParticipants.length > MAX_GROUP_SIZE) {
      return NextResponse.json({ error: `Group chats limited to ${MAX_GROUP_SIZE} participants` }, { status: 400 });
    }

    if (type === 'group' && allParticipants.length < 3) {
      return NextResponse.json({ error: 'Group chats need at least 3 participants' }, { status: 400 });
    }

    // Verify all participants are teens
    const { data: participantProfiles } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', allParticipants);

    const nonTeens = participantProfiles?.filter(p => p.role !== 'teen') || [];
    if (nonTeens.length > 0) {
      return NextResponse.json({ error: 'All participants must be teens' }, { status: 400 });
    }

    // Check blocked users
    const { data: blocks } = await supabase
      .from('blocked_users')
      .select('blocked_user_id')
      .eq('user_id', user.id);

    const blockedIds = blocks?.map(b => b.blocked_user_id) || [];
    const blockedParticipant = participants.find((p: string) => blockedIds.includes(p));
    if (blockedParticipant) {
      return NextResponse.json({ error: 'Cannot start chat with blocked user' }, { status: 400 });
    }

    // For one-on-one: check if chat already exists between these two
    if (type === 'one-on-one') {
      const otherId = allParticipants.find(id => id !== user.id)!;

      const { data: existingChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (existingChats && existingChats.length > 0) {
        const { data: otherChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', otherId)
          .in('chat_id', existingChats.map(c => c.chat_id));

        if (otherChats && otherChats.length > 0) {
          // Check if any of these are one-on-one
          const { data: existingOneOnOne } = await supabase
            .from('chats')
            .select('id')
            .in('id', otherChats.map(c => c.chat_id))
            .eq('chat_type', 'one-on-one')
            .limit(1);

          if (existingOneOnOne && existingOneOnOne.length > 0) {
            return NextResponse.json({ chat_id: existingOneOnOne[0].id, existing: true });
          }
        }
      }
    }

    // Create the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        chat_type: type,
        name: type === 'group' ? (name || 'Group Chat') : null,
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError) {
      console.error('Chat creation error:', chatError);
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }

    // Add participants
    const participantRows = allParticipants.map(uid => ({
      chat_id: chat.id,
      user_id: uid,
    }));

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participantRows);

    if (participantError) {
      console.error('Participant insert error:', participantError);
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
    }

    // Create streak record for one-on-one chats
    if (type === 'one-on-one') {
      await supabase
        .from('chat_streaks')
        .insert({ chat_id: chat.id, streak_count: 0 });
    }

    return NextResponse.json({ chat_id: chat.id, existing: false });
  } catch (error: any) {
    console.error('Chat start error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start chat' }, { status: 500 });
  }
}
