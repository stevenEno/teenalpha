-- Fix: Enable RLS on all incentive system tables
-- Run this directly in Supabase SQL Editor

-- =========================================
-- 1. incentive_assignments
-- =========================================
ALTER TABLE incentive_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assignment"
  ON incentive_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignment"
  ON incentive_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignment"
  ON incentive_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 2. quests
-- =========================================
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quests"
  ON quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
  ON quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON quests FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 3. user_quest_progress
-- =========================================
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quest progress"
  ON user_quest_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quest progress"
  ON user_quest_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress"
  ON user_quest_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 4. ladders
-- =========================================
ALTER TABLE ladders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ladders"
  ON ladders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ladders"
  ON ladders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ladder members can update their ladder"
  ON ladders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ladder_members
      WHERE ladder_members.ladder_id = ladders.id
      AND ladder_members.user_id = auth.uid()
    )
  );

-- =========================================
-- 5. ladder_members
-- =========================================
ALTER TABLE ladder_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ladder members"
  ON ladder_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join ladders"
  ON ladder_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ladder membership"
  ON ladder_members FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 6. challenges
-- =========================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read challenges"
  ON challenges FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Ladder members can insert challenges"
  ON challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ladder_members
      WHERE ladder_members.ladder_id = challenges.ladder_id
      AND ladder_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Ladder members can update challenges"
  ON challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ladder_members
      WHERE ladder_members.ladder_id = challenges.ladder_id
      AND ladder_members.user_id = auth.uid()
    )
  );

-- =========================================
-- 7. challenge_completions
-- =========================================
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own completions"
  ON challenge_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Ladder members can read completions in their ladder"
  ON challenge_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      JOIN ladder_members lm ON lm.ladder_id = c.ladder_id
      WHERE c.id = challenge_completions.challenge_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own completions"
  ON challenge_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON challenge_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 8. ambition_goals
-- =========================================
ALTER TABLE ambition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals"
  ON ambition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON ambition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON ambition_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 9. daily_tracks
-- =========================================
ALTER TABLE daily_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily tracks"
  ON daily_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ambition_goals
      WHERE ambition_goals.id = daily_tracks.goal_id
      AND ambition_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily tracks"
  ON daily_tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ambition_goals
      WHERE ambition_goals.id = daily_tracks.goal_id
      AND ambition_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily tracks"
  ON daily_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ambition_goals
      WHERE ambition_goals.id = daily_tracks.goal_id
      AND ambition_goals.user_id = auth.uid()
    )
  );

-- =========================================
-- 10. incentive_events
-- =========================================
ALTER TABLE incentive_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events"
  ON incentive_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON incentive_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
