-- Run in Supabase SQL Editor to create messaging tables
-- This is the standalone version of supabase/migrations/20260201_messaging.sql

-- Chats (one-on-one or group)
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_type TEXT NOT NULL DEFAULT 'one-on-one' CHECK (chat_type IN ('one-on-one', 'group')),
  name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat participants (join table for proper RLS)
CREATE TABLE chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Messages (ephemeral by default)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video', 'sticker')),
  media_url TEXT,
  viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat streaks (per one-on-one pair)
CREATE TABLE chat_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE UNIQUE,
  streak_count INT DEFAULT 0,
  last_message_date DATE,
  longest_streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat reports
CREATE TABLE chat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked users (per-user block list)
CREATE TABLE blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Indexes
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_expires ON messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_chat_streaks_chat ON chat_streaks(chat_id);
CREATE INDEX idx_blocked_users_user ON blocked_users(user_id);

-- Auto-update streak updated_at
CREATE OR REPLACE FUNCTION update_chat_streak_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_streak_updated
  BEFORE UPDATE ON chat_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_streak_timestamp();

-- =========================================
-- Row Level Security
-- =========================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- chats: participants can read their chats, teens can create
CREATE POLICY "Participants can read their chats"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chats.id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- chat_participants: can read participants of own chats, can insert into own chats
CREATE POLICY "Users can read participants of their chats"
  ON chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants AS cp
      WHERE cp.chat_id = chat_participants.chat_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Chat creators can add participants"
  ON chat_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_participants.chat_id
      AND chats.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can update own participation"
  ON chat_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- messages: participants can read/insert messages in their chats
CREATE POLICY "Participants can read messages in their chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages to their chats"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Participants can mark messages as viewed"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- chat_streaks: participants can read/update streaks for their chats
CREATE POLICY "Participants can read their chat streaks"
  ON chat_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_streaks.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert chat streaks"
  ON chat_streaks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_streaks.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update chat streaks"
  ON chat_streaks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_streaks.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- chat_reports: users can insert own reports, read own reports
CREATE POLICY "Users can create reports"
  ON chat_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own reports"
  ON chat_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- blocked_users: users can manage own block list
CREATE POLICY "Users can read own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for messages table (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
