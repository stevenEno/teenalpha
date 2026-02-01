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
