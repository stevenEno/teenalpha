-- ============================================================================
-- TEEN ALPHA - COMPLETE PRODUCTION DATABASE MIGRATION
-- ============================================================================
-- Run this entire script in Supabase SQL Editor for a fresh production database
-- This creates ALL tables, functions, triggers, and RLS policies from scratch.
--
-- PREREQUISITES:
-- 1. A fresh Supabase project (supabase.com)
-- 2. That's it! This script creates everything.
--
-- AFTER RUNNING THIS SCRIPT:
-- 1. Set up Storage buckets (see end of file for instructions)
-- 2. Create your admin user and set role = 'admin'
-- 3. Create your default mentor
-- ============================================================================


-- ============================================================================
-- SECTION 0: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- SECTION 1: PROFILES TABLE (Base - links to Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('teen', 'mentor', 'parent', 'admin')) NOT NULL DEFAULT 'teen',
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,

  -- Teen-specific fields
  grade TEXT,
  school TEXT,
  bio TEXT,

  -- Mentor-specific fields
  expertise TEXT[],
  max_mentees INTEGER DEFAULT 5,
  linkedin_url TEXT,
  is_default_mentor BOOLEAN DEFAULT FALSE,

  -- Social media connections
  steam_id TEXT,
  steam_profile_name TEXT,
  steam_connected_at TIMESTAMPTZ,
  roblox_username TEXT,
  instagram_connected_at TIMESTAMPTZ,
  instagram_filename TEXT,
  tiktok_connected_at TIMESTAMPTZ,
  tiktok_filename TEXT,
  snapchat_connected_at TIMESTAMPTZ,
  snapchat_filename TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 2: PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),

  -- AI generation tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


-- ============================================================================
-- SECTION 3: TASKS TABLE (Kanban Cards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  order_index INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  -- Evidence
  evidence_url TEXT,
  evidence_type TEXT,
  evidence_description TEXT,

  -- AI generation tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  suggested_evidence TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


-- ============================================================================
-- SECTION 4: MENTORSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),

  -- Invitation tracking
  invited_by UUID REFERENCES public.profiles(id),
  invitation_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(mentor_id, teen_id)
);


-- ============================================================================
-- SECTION 5: FAMILY CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  relationship TEXT,
  verification_code TEXT,
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,

  UNIQUE(parent_id, teen_id)
);


-- ============================================================================
-- SECTION 6: COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (project_id IS NOT NULL AND task_id IS NULL) OR
    (project_id IS NULL AND task_id IS NOT NULL)
  )
);


-- ============================================================================
-- SECTION 7: PAYMENTS SCHEMA (Stripe Integration)
-- ============================================================================

-- Mentor pricing table
CREATE TABLE IF NOT EXISTS public.mentor_pricing (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate INTEGER NOT NULL DEFAULT 10000, -- cents ($100)
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id)
);

-- Hour packages table
CREATE TABLE IF NOT EXISTS public.hour_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hours INTEGER NOT NULL,
  price INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hour balances table
CREATE TABLE IF NOT EXISTS public.hour_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_purchased_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_used_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, mentor_id, teen_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1,
  notes TEXT,
  mentor_notes TEXT,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  hours_purchased NUMERIC(10,2) NOT NULL,
  package_id UUID REFERENCES public.hour_packages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type TEXT NOT NULL DEFAULT 'hourly' CHECK (payment_type IN ('hourly', 'package', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


-- ============================================================================
-- SECTION 8: SOCIAL MEDIA ANALYSIS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.social_media_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'snapchat', 'steam')),
  raw_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB,
  analysis JSONB,
  profile_description TEXT,
  top_interests TEXT[],
  content_themes TEXT[],
  suggested_skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);


-- ============================================================================
-- SECTION 8B: GAMING ANALYSIS TABLE (Steam/Roblox)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gaming_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('steam', 'roblox')),
  raw_data JSONB NOT NULL DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  top_games JSONB DEFAULT '[]',
  top_genres TEXT[],
  total_playtime_hours NUMERIC(10,2),
  suggested_skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);


-- ============================================================================
-- SECTION 8C: PROJECT RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  why_matches TEXT,
  skills_learned TEXT[],
  difficulty TEXT,
  estimated_time TEXT,
  tech_stack TEXT[],
  first_step TEXT,
  data_source TEXT CHECK (data_source IN ('gaming', 'social')),
  source_platform TEXT CHECK (source_platform IN ('steam', 'roblox', 'instagram', 'tiktok', 'snapchat')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 8D: MENTOR RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mentor_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recommended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  linkedin_url TEXT NOT NULL,
  linkedin_username TEXT NOT NULL,
  recommendation_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'joined', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(linkedin_username)
);


-- ============================================================================
-- SECTION 8E: PROMPT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 9: STARTUP PATHWAYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.startup_pathways (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_interests JSONB NOT NULL DEFAULT '{}',
  tbpn_episodes JSONB DEFAULT '[]',
  pathways JSONB NOT NULL DEFAULT '[]',
  chosen_pathway_index INTEGER,
  chosen_at TIMESTAMPTZ,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 10: A/B TESTING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ab_test_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 11: AI PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- SECTION 12: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default_mentor ON public.profiles(is_default_mentor) WHERE is_default_mentor = TRUE;

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_teen_id ON public.projects(teen_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Mentorships
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor_id ON public.mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_teen_id ON public.mentorships(teen_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON public.mentorships(status);

-- Family Connections
CREATE INDEX IF NOT EXISTS idx_family_connections_parent_id ON public.family_connections(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_teen_id ON public.family_connections(teen_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_verified ON public.family_connections(verified) WHERE verified = TRUE;

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_mentor_pricing_mentor_id ON public.mentor_pricing(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hour_packages_mentor_id ON public.hour_packages(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hour_balances_family_id ON public.hour_balances(family_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_family_id ON public.payments(family_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session ON public.payments(stripe_checkout_session_id);

-- Social Media
CREATE INDEX IF NOT EXISTS idx_social_media_analysis_profile_id ON public.social_media_analysis(profile_id);

-- Gaming Analysis
CREATE INDEX IF NOT EXISTS idx_gaming_analysis_profile_id ON public.gaming_analysis(profile_id);
CREATE INDEX IF NOT EXISTS idx_gaming_analysis_platform ON public.gaming_analysis(platform);

-- Project Recommendations
CREATE INDEX IF NOT EXISTS idx_project_recommendations_profile_id ON public.project_recommendations(profile_id);

-- Mentor Recommendations
CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_status ON public.mentor_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_mentor_recommendations_linkedin_username ON public.mentor_recommendations(linkedin_username);

-- Prompt Templates
CREATE INDEX IF NOT EXISTS idx_prompt_templates_prompt_id ON public.prompt_templates(prompt_id);

-- Startup Pathways
CREATE INDEX IF NOT EXISTS idx_startup_pathways_profile_id ON public.startup_pathways(profile_id);

-- A/B Testing
CREATE INDEX IF NOT EXISTS idx_ab_test_events_variant ON public.ab_test_events(variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type ON public.ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_created_at ON public.ab_test_events(created_at DESC);


-- ============================================================================
-- SECTION 13: FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teen'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to set verification code on insert
CREATE OR REPLACE FUNCTION public.set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := public.generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign default mentor to new teens
CREATE OR REPLACE FUNCTION public.assign_default_mentor()
RETURNS TRIGGER AS $$
DECLARE
  default_mentor_id UUID;
BEGIN
  IF NEW.role = 'teen' THEN
    SELECT id INTO default_mentor_id
    FROM public.profiles
    WHERE is_default_mentor = TRUE
    LIMIT 1;

    IF default_mentor_id IS NOT NULL THEN
      INSERT INTO public.mentorships (mentor_id, teen_id, status, invitation_message, accepted_at)
      VALUES (
        default_mentor_id,
        NEW.id,
        'active',
        'Welcome to Teen Alpha! Your default mentor has been automatically assigned.',
        NOW()
      )
      ON CONFLICT (mentor_id, teen_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check mentor capacity
CREATE OR REPLACE FUNCTION public.check_mentor_capacity()
RETURNS TRIGGER AS $$
DECLARE
  mentor_max INTEGER;
  current_count INTEGER;
  is_default BOOLEAN;
BEGIN
  SELECT COALESCE(max_mentees, 5), COALESCE(is_default_mentor, FALSE)
  INTO mentor_max, is_default
  FROM public.profiles
  WHERE id = NEW.mentor_id;

  IF is_default THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.mentorships
  WHERE mentor_id = NEW.mentor_id AND status = 'active';

  IF current_count >= mentor_max THEN
    RAISE EXCEPTION 'Mentor has reached maximum capacity of % mentees', mentor_max;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to credit hours after payment
CREATE OR REPLACE FUNCTION public.credit_hours_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.hour_balances (family_id, mentor_id, teen_id, balance_hours, total_purchased_hours, total_used_hours)
    VALUES (NEW.family_id, NEW.mentor_id, NEW.teen_id, NEW.hours_purchased, NEW.hours_purchased, 0)
    ON CONFLICT (family_id, mentor_id, teen_id)
    DO UPDATE SET
      balance_hours = hour_balances.balance_hours + NEW.hours_purchased,
      total_purchased_hours = hour_balances.total_purchased_hours + NEW.hours_purchased,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct hours on session complete
CREATE OR REPLACE FUNCTION public.deduct_hours_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.hour_balances
    SET
      balance_hours = balance_hours - NEW.duration_hours,
      total_used_hours = total_used_hours + NEW.duration_hours,
      updated_at = NOW()
    WHERE family_id = NEW.family_id
      AND mentor_id = NEW.mentor_id
      AND teen_id = NEW.teen_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A/B Test funnel function
CREATE OR REPLACE FUNCTION public.get_ab_test_funnel(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  variant TEXT,
  views BIGINT,
  signups_started BIGINT,
  signups_completed BIGINT,
  onboarding_completed BIGINT,
  view_to_signup_rate NUMERIC,
  signup_to_complete_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.variant,
    COUNT(*) FILTER (WHERE e.event_type = 'view') as views,
    COUNT(*) FILTER (WHERE e.event_type = 'signup_started') as signups_started,
    COUNT(*) FILTER (WHERE e.event_type = 'signup_completed') as signups_completed,
    COUNT(*) FILTER (WHERE e.event_type = 'onboarding_completed') as onboarding_completed,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') > 0
      THEN ROUND(COUNT(*) FILTER (WHERE e.event_type = 'signup_completed')::NUMERIC / COUNT(*) FILTER (WHERE e.event_type = 'view')::NUMERIC * 100, 2)
      ELSE 0
    END as view_to_signup_rate,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'signup_started') > 0
      THEN ROUND(COUNT(*) FILTER (WHERE e.event_type = 'signup_completed')::NUMERIC / COUNT(*) FILTER (WHERE e.event_type = 'signup_started')::NUMERIC * 100, 2)
      ELSE 0
    END as signup_to_complete_rate
  FROM public.ab_test_events e
  WHERE e.created_at BETWEEN start_date AND end_date
  GROUP BY e.variant
  ORDER BY views DESC;
END;
$$;


-- ============================================================================
-- SECTION 14: TRIGGERS
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS social_media_analysis_updated_at ON public.social_media_analysis;
CREATE TRIGGER social_media_analysis_updated_at BEFORE UPDATE ON public.social_media_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS gaming_analysis_updated_at ON public.gaming_analysis;
CREATE TRIGGER gaming_analysis_updated_at BEFORE UPDATE ON public.gaming_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS project_recommendations_updated_at ON public.project_recommendations;
CREATE TRIGGER project_recommendations_updated_at BEFORE UPDATE ON public.project_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS mentor_recommendations_updated_at ON public.mentor_recommendations;
CREATE TRIGGER mentor_recommendations_updated_at BEFORE UPDATE ON public.mentor_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS prompt_templates_updated_at ON public.prompt_templates;
CREATE TRIGGER prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS startup_pathways_updated_at ON public.startup_pathways;
CREATE TRIGGER startup_pathways_updated_at BEFORE UPDATE ON public.startup_pathways
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- New user trigger (create profile on signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Assign default mentor trigger
DROP TRIGGER IF EXISTS on_profile_created_assign_mentor ON public.profiles;
CREATE TRIGGER on_profile_created_assign_mentor
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_mentor();

-- Verification code trigger
DROP TRIGGER IF EXISTS set_verification_code_trigger ON public.family_connections;
CREATE TRIGGER set_verification_code_trigger
  BEFORE INSERT ON public.family_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_verification_code();

-- Mentor capacity check trigger
DROP TRIGGER IF EXISTS check_mentor_capacity_trigger ON public.mentorships;
CREATE TRIGGER check_mentor_capacity_trigger
  BEFORE INSERT ON public.mentorships
  FOR EACH ROW EXECUTE FUNCTION public.check_mentor_capacity();

-- Payment hour credit trigger
DROP TRIGGER IF EXISTS credit_hours_trigger ON public.payments;
CREATE TRIGGER credit_hours_trigger
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.credit_hours_after_payment();

-- Session hour deduction trigger
DROP TRIGGER IF EXISTS deduct_hours_trigger ON public.sessions;
CREATE TRIGGER deduct_hours_trigger
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.deduct_hours_on_session_complete();


-- ============================================================================
-- SECTION 15: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 16: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ==================== PROFILES ====================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view mentor profiles" ON public.profiles;
CREATE POLICY "Anyone can view mentor profiles"
  ON public.profiles FOR SELECT
  USING (role = 'mentor');

DROP POLICY IF EXISTS "Mentors can view mentee profiles" ON public.profiles;
CREATE POLICY "Mentors can view mentee profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT teen_id FROM public.mentorships
      WHERE mentor_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Parents can view teen profiles" ON public.profiles;
CREATE POLICY "Parents can view teen profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT teen_id FROM public.family_connections
      WHERE parent_id = auth.uid()
    )
  );

-- NOTE: "Parents can search teens" policy removed - it caused infinite recursion
-- by querying profiles table from within a profiles policy.
-- Parents can view teen profiles through the family_connections policy instead.

-- ==================== PROJECTS ====================

DROP POLICY IF EXISTS "Teens can view own projects" ON public.projects;
CREATE POLICY "Teens can view own projects"
  ON public.projects FOR SELECT
  USING (teen_id = auth.uid());

DROP POLICY IF EXISTS "Teens can create own projects" ON public.projects;
CREATE POLICY "Teens can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (teen_id = auth.uid());

DROP POLICY IF EXISTS "Teens can update own projects" ON public.projects;
CREATE POLICY "Teens can update own projects"
  ON public.projects FOR UPDATE
  USING (teen_id = auth.uid());

DROP POLICY IF EXISTS "Teens can delete own projects" ON public.projects;
CREATE POLICY "Teens can delete own projects"
  ON public.projects FOR DELETE
  USING (teen_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can view mentee projects" ON public.projects;
CREATE POLICY "Mentors can view mentee projects"
  ON public.projects FOR SELECT
  USING (
    teen_id IN (
      SELECT teen_id FROM public.mentorships
      WHERE mentor_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Parents can view teen projects" ON public.projects;
CREATE POLICY "Parents can view teen projects"
  ON public.projects FOR SELECT
  USING (
    teen_id IN (
      SELECT teen_id FROM public.family_connections
      WHERE parent_id = auth.uid()
    )
  );

-- ==================== TASKS ====================

DROP POLICY IF EXISTS "Teens can view own project tasks" ON public.tasks;
CREATE POLICY "Teens can view own project tasks"
  ON public.tasks FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE teen_id = auth.uid()));

DROP POLICY IF EXISTS "Teens can create own project tasks" ON public.tasks;
CREATE POLICY "Teens can create own project tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE teen_id = auth.uid()));

DROP POLICY IF EXISTS "Teens can update own project tasks" ON public.tasks;
CREATE POLICY "Teens can update own project tasks"
  ON public.tasks FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE teen_id = auth.uid()));

DROP POLICY IF EXISTS "Teens can delete own project tasks" ON public.tasks;
CREATE POLICY "Teens can delete own project tasks"
  ON public.tasks FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE teen_id = auth.uid()));

DROP POLICY IF EXISTS "Mentors can view mentee tasks" ON public.tasks;
CREATE POLICY "Mentors can view mentee tasks"
  ON public.tasks FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.mentorships m ON p.teen_id = m.teen_id
      WHERE m.mentor_id = auth.uid() AND m.status = 'active'
    )
  );

-- ==================== MENTORSHIPS ====================

DROP POLICY IF EXISTS "Mentors can view own mentorships" ON public.mentorships;
CREATE POLICY "Mentors can view own mentorships"
  ON public.mentorships FOR SELECT
  USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Teens can view own mentorships" ON public.mentorships;
CREATE POLICY "Teens can view own mentorships"
  ON public.mentorships FOR SELECT
  USING (teen_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view teen mentorships" ON public.mentorships;
CREATE POLICY "Parents can view teen mentorships"
  ON public.mentorships FOR SELECT
  USING (
    teen_id IN (
      SELECT teen_id FROM public.family_connections
      WHERE parent_id = auth.uid() AND verified = TRUE
    )
  );

DROP POLICY IF EXISTS "Parents can create mentorship invitations" ON public.mentorships;
CREATE POLICY "Parents can create mentorship invitations"
  ON public.mentorships FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    teen_id IN (SELECT teen_id FROM public.family_connections WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Mentors can update mentorship status" ON public.mentorships;
CREATE POLICY "Mentors can update mentorship status"
  ON public.mentorships FOR UPDATE
  USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert mentorships" ON public.mentorships;
CREATE POLICY "Users can insert mentorships"
  ON public.mentorships FOR INSERT
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = teen_id);

-- ==================== FAMILY CONNECTIONS ====================

DROP POLICY IF EXISTS "Parents can view own family connections" ON public.family_connections;
CREATE POLICY "Parents can view own family connections"
  ON public.family_connections FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Teens can view own family connections" ON public.family_connections;
CREATE POLICY "Teens can view own family connections"
  ON public.family_connections FOR SELECT
  USING (teen_id = auth.uid());

DROP POLICY IF EXISTS "Parents can create family connections" ON public.family_connections;
CREATE POLICY "Parents can create family connections"
  ON public.family_connections FOR INSERT
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Users can update family connections" ON public.family_connections;
CREATE POLICY "Users can update family connections"
  ON public.family_connections FOR UPDATE
  USING (parent_id = auth.uid() OR teen_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete family connections" ON public.family_connections;
CREATE POLICY "Users can delete family connections"
  ON public.family_connections FOR DELETE
  USING (parent_id = auth.uid() OR teen_id = auth.uid());

-- ==================== COMMENTS ====================

DROP POLICY IF EXISTS "View comments on accessible projects" ON public.comments;
CREATE POLICY "View comments on accessible projects"
  ON public.comments FOR SELECT
  USING (
    author_id = auth.uid() OR
    project_id IN (SELECT id FROM public.projects WHERE teen_id = auth.uid()) OR
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.mentorships m ON p.teen_id = m.teen_id
      WHERE m.mentor_id = auth.uid() AND m.status = 'active'
    ) OR
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.teen_id = auth.uid()
    ) OR
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      JOIN public.mentorships m ON p.teen_id = m.teen_id
      WHERE m.mentor_id = auth.uid() AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid());

-- ==================== MENTOR PRICING ====================

DROP POLICY IF EXISTS "Anyone can view mentor pricing" ON public.mentor_pricing;
CREATE POLICY "Anyone can view mentor pricing"
  ON public.mentor_pricing FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Mentors can update own pricing" ON public.mentor_pricing;
CREATE POLICY "Mentors can update own pricing"
  ON public.mentor_pricing FOR UPDATE
  USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Mentors can insert own pricing" ON public.mentor_pricing;
CREATE POLICY "Mentors can insert own pricing"
  ON public.mentor_pricing FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

-- ==================== HOUR PACKAGES ====================

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.hour_packages;
CREATE POLICY "Anyone can view active packages"
  ON public.hour_packages FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Mentors can manage packages" ON public.hour_packages;
CREATE POLICY "Mentors can manage packages"
  ON public.hour_packages FOR ALL
  USING (mentor_id = auth.uid());

-- ==================== HOUR BALANCES ====================

DROP POLICY IF EXISTS "Users can view own hour balances" ON public.hour_balances;
CREATE POLICY "Users can view own hour balances"
  ON public.hour_balances FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = mentor_id OR auth.uid() = teen_id);

DROP POLICY IF EXISTS "Service role can manage hour balances" ON public.hour_balances;
CREATE POLICY "Service role can manage hour balances"
  ON public.hour_balances FOR ALL
  TO service_role
  USING (true);

-- ==================== SESSIONS ====================

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = mentor_id OR auth.uid() = teen_id);

DROP POLICY IF EXISTS "Parents can create sessions" ON public.sessions;
CREATE POLICY "Parents can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = family_id);

DROP POLICY IF EXISTS "Mentors and parents can update sessions" ON public.sessions;
CREATE POLICY "Mentors and parents can update sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = family_id);

-- ==================== PAYMENTS ====================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
CREATE POLICY "Service role can manage payments"
  ON public.payments FOR ALL
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "Parents can create payments" ON public.payments;
CREATE POLICY "Parents can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = family_id);

-- ==================== SOCIAL MEDIA ANALYSIS ====================

DROP POLICY IF EXISTS "Users can view own analysis" ON public.social_media_analysis;
CREATE POLICY "Users can view own analysis"
  ON public.social_media_analysis FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own analysis" ON public.social_media_analysis;
CREATE POLICY "Users can insert own analysis"
  ON public.social_media_analysis FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own analysis" ON public.social_media_analysis;
CREATE POLICY "Users can update own analysis"
  ON public.social_media_analysis FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own analysis" ON public.social_media_analysis;
CREATE POLICY "Users can delete own analysis"
  ON public.social_media_analysis FOR DELETE
  USING (profile_id = auth.uid());

-- ==================== GAMING ANALYSIS ====================

DROP POLICY IF EXISTS "Users can view own gaming analysis" ON public.gaming_analysis;
CREATE POLICY "Users can view own gaming analysis"
  ON public.gaming_analysis FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own gaming analysis" ON public.gaming_analysis;
CREATE POLICY "Users can insert own gaming analysis"
  ON public.gaming_analysis FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own gaming analysis" ON public.gaming_analysis;
CREATE POLICY "Users can update own gaming analysis"
  ON public.gaming_analysis FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own gaming analysis" ON public.gaming_analysis;
CREATE POLICY "Users can delete own gaming analysis"
  ON public.gaming_analysis FOR DELETE
  USING (profile_id = auth.uid());

-- ==================== PROJECT RECOMMENDATIONS ====================

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.project_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON public.project_recommendations FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.project_recommendations;
CREATE POLICY "Users can insert own recommendations"
  ON public.project_recommendations FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own recommendations" ON public.project_recommendations;
CREATE POLICY "Users can update own recommendations"
  ON public.project_recommendations FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.project_recommendations;
CREATE POLICY "Users can delete own recommendations"
  ON public.project_recommendations FOR DELETE
  USING (profile_id = auth.uid());

-- ==================== MENTOR RECOMMENDATIONS ====================

DROP POLICY IF EXISTS "Anyone can submit mentor recommendations" ON public.mentor_recommendations;
CREATE POLICY "Anyone can submit mentor recommendations"
  ON public.mentor_recommendations FOR INSERT
  WITH CHECK (auth.uid() = recommended_by);

DROP POLICY IF EXISTS "Users can view own mentor recommendations" ON public.mentor_recommendations;
CREATE POLICY "Users can view own mentor recommendations"
  ON public.mentor_recommendations FOR SELECT
  USING (recommended_by = auth.uid());

DROP POLICY IF EXISTS "Admins can view all mentor recommendations" ON public.mentor_recommendations;
CREATE POLICY "Admins can view all mentor recommendations"
  ON public.mentor_recommendations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update mentor recommendations" ON public.mentor_recommendations;
CREATE POLICY "Admins can update mentor recommendations"
  ON public.mentor_recommendations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== PROMPT TEMPLATES ====================

DROP POLICY IF EXISTS "Anyone can view prompt templates" ON public.prompt_templates;
CREATE POLICY "Anyone can view prompt templates"
  ON public.prompt_templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage prompt templates" ON public.prompt_templates;
CREATE POLICY "Admins can manage prompt templates"
  ON public.prompt_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== STARTUP PATHWAYS ====================

DROP POLICY IF EXISTS "Users can view own pathways" ON public.startup_pathways;
CREATE POLICY "Users can view own pathways"
  ON public.startup_pathways FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own pathways" ON public.startup_pathways;
CREATE POLICY "Users can insert own pathways"
  ON public.startup_pathways FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own pathways" ON public.startup_pathways;
CREATE POLICY "Users can update own pathways"
  ON public.startup_pathways FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own pathways" ON public.startup_pathways;
CREATE POLICY "Users can delete own pathways"
  ON public.startup_pathways FOR DELETE
  USING (profile_id = auth.uid());

-- ==================== A/B TEST EVENTS ====================

DROP POLICY IF EXISTS "Anyone can insert ab_test_events" ON public.ab_test_events;
CREATE POLICY "Anyone can insert ab_test_events"
  ON public.ab_test_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read ab_test_events" ON public.ab_test_events;
CREATE POLICY "Admins can read ab_test_events"
  ON public.ab_test_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== AI PROMPTS ====================

DROP POLICY IF EXISTS "Anyone can view active prompts" ON public.ai_prompts;
CREATE POLICY "Anyone can view active prompts"
  ON public.ai_prompts FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage prompts" ON public.ai_prompts;
CREATE POLICY "Admins can manage prompts"
  ON public.ai_prompts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================================
-- SECTION 17: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Allow anon to insert A/B test events
GRANT INSERT ON public.ab_test_events TO anon;


-- ============================================================================
-- SECTION 18: A/B TEST STATS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.ab_test_stats
WITH (security_invoker = true) AS
SELECT
  variant,
  event_type,
  DATE(created_at) as date,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM public.ab_test_events
GROUP BY variant, event_type, DATE(created_at);


-- ============================================================================
-- SECTION 19: VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEEN ALPHA PRODUCTION MIGRATION COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - projects';
  RAISE NOTICE '  - tasks';
  RAISE NOTICE '  - mentorships';
  RAISE NOTICE '  - family_connections';
  RAISE NOTICE '  - comments';
  RAISE NOTICE '  - mentor_pricing';
  RAISE NOTICE '  - hour_packages';
  RAISE NOTICE '  - hour_balances';
  RAISE NOTICE '  - sessions';
  RAISE NOTICE '  - payments';
  RAISE NOTICE '  - social_media_analysis';
  RAISE NOTICE '  - gaming_analysis';
  RAISE NOTICE '  - project_recommendations';
  RAISE NOTICE '  - mentor_recommendations';
  RAISE NOTICE '  - prompt_templates';
  RAISE NOTICE '  - startup_pathways';
  RAISE NOTICE '  - ab_test_events';
  RAISE NOTICE '  - ai_prompts';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Set up Storage buckets (see below)';
  RAISE NOTICE '2. Create admin user and run:';
  RAISE NOTICE '   UPDATE profiles SET role = ''admin'' WHERE email = ''you@example.com'';';
  RAISE NOTICE '3. Create default mentor and run:';
  RAISE NOTICE '   UPDATE profiles SET is_default_mentor = true, role = ''mentor'', max_mentees = 999999 WHERE email = ''mentor@example.com'';';
  RAISE NOTICE '============================================';
END $$;


-- ============================================================================
-- STORAGE BUCKET SETUP (Run separately in Supabase Dashboard)
-- ============================================================================
--
-- Go to Supabase Dashboard → Storage → Create new bucket:
--
-- 1. Bucket name: "evidence"
--    - Public: No (use signed URLs)
--    - File size limit: 50MB
--    - Allowed MIME types: image/*, video/*, application/pdf
--
-- 2. Create bucket policies:
--
--    -- Allow authenticated users to upload to their own folder
--    CREATE POLICY "Users can upload evidence"
--    ON storage.objects FOR INSERT
--    WITH CHECK (
--      bucket_id = 'evidence' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    -- Allow users to view their own evidence
--    CREATE POLICY "Users can view own evidence"
--    ON storage.objects FOR SELECT
--    USING (
--      bucket_id = 'evidence' AND
--      auth.uid()::text = (storage.foldername(name))[1]
--    );
--
--    -- Allow mentors to view mentee evidence
--    CREATE POLICY "Mentors can view mentee evidence"
--    ON storage.objects FOR SELECT
--    USING (
--      bucket_id = 'evidence' AND
--      EXISTS (
--        SELECT 1 FROM public.mentorships
--        WHERE mentor_id = auth.uid()
--        AND teen_id::text = (storage.foldername(name))[1]
--        AND status = 'active'
--      )
--    );
-- ============================================================================
