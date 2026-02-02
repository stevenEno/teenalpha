-- Incentive assignment (which system a teen is using)
CREATE TABLE incentive_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system text NOT NULL CHECK (system IN ('quest', 'ladder', 'tracker')),
  assigned_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(user_id)
);

-- System 1: Quests
CREATE TABLE quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chain_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  estimated_minutes int NOT NULL,
  proof_type text NOT NULL DEFAULT 'text',
  order_index int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  proof_text text,
  discomfort_rating int CHECK (discomfort_rating BETWEEN 1 AND 5),
  points_earned int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_quest_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  total_points int DEFAULT 0,
  level int DEFAULT 1,
  last_completed_date date,
  recovery_available boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- System 2: Ladders
CREATE TABLE ladders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest text NOT NULL,
  status text NOT NULL DEFAULT 'forming' CHECK (status IN ('forming','active','completed')),
  current_day int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ladder_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id uuid REFERENCES ladders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tokens int DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(ladder_id, user_id)
);

CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id uuid REFERENCES ladders(id) ON DELETE CASCADE NOT NULL,
  day int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('normal','hard')),
  is_selected boolean DEFAULT false,
  votes jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','voting','active','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proof_text text,
  discomfort_rating int CHECK (discomfort_rating BETWEEN 1 AND 5),
  tokens_earned int DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- System 3: Ambition Tracker
CREATE TABLE ambition_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_text text NOT NULL,
  week_start date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  total_stars int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE daily_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES ambition_goals(id) ON DELETE CASCADE NOT NULL,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  task_description text NOT NULL,
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  evidence_text text,
  effort_rating int CHECK (effort_rating BETWEEN 1 AND 5),
  stars_earned int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Shared: Incentive events log
CREATE TABLE incentive_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system text NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quests_user_date ON quests(user_id, chain_date);
CREATE INDEX idx_ladder_members_user ON ladder_members(user_id);
CREATE INDEX idx_challenges_ladder ON challenges(ladder_id, day);
CREATE INDEX idx_daily_tracks_goal ON daily_tracks(goal_id, day_number);
CREATE INDEX idx_incentive_events_user ON incentive_events(user_id, system, created_at);

-- =========================================
-- Row Level Security
-- =========================================

-- incentive_assignments: users read/write own row
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

-- quests: users read/write own quests
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

-- user_quest_progress: users read/write own progress
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

-- ladders: any authenticated user can read (needed to browse/join), members can update
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

-- ladder_members: users can read members of any ladder (for group display), insert/update own
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

-- challenges: any authenticated user can read (for voting/viewing), ladder members can insert/update
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

-- challenge_completions: users read/write own, ladder members can read others in same ladder
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

-- ambition_goals: users read/write own goals
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

-- daily_tracks: users read/write tracks for their own goals
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

-- incentive_events: users read/write own events
ALTER TABLE incentive_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events"
  ON incentive_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON incentive_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
