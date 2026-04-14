-- ============================================================================
-- TEEN ALPHA - COMPLETE PRODUCTION DATABASE MIGRATION
-- ============================================================================
-- Run this entire script in Supabase SQL Editor for a fresh production database.
-- Creates ALL tables, functions, triggers, and RLS policies from scratch.
--
-- This file is the canonical fresh-DB setup. Sections 1-19 are the original
-- base schema. Sections 20-29 fold in the legacy apps/web/sql/ migrations
-- (011_visual_onboarding, create_teen_discover_rls, fix_rls_incentive_tables)
-- plus all supabase/migrations/* files (incentive_systems, messaging,
-- profile_customizations, first_dollar_sprint, calendly_url, etc.) so a
-- single run of this file produces a complete, code-ready database.
--
-- IDEMPOTENCY: ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS, and
-- CREATE OR REPLACE FUNCTION are safe to re-run. Plain CREATE POLICY
-- statements (Postgres has no IF NOT EXISTS for policies) will error on
-- re-run if the policy already exists. For a fresh DB this is moot.
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
        'Your starter mentor is connected. Message them whenever you''re ready to talk through a project.',
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

-- ============================================================================
-- SECTION 20: PROFILE COLUMN EXTENSIONS
--   Onboarding tracking (from 011_visual_onboarding) + mentor scheduling link
--   (from 20260413_mentor_calendly_url). Idempotent ADD COLUMN IF NOT EXISTS.
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_interest TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_alpha_awarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

COMMENT ON COLUMN public.profiles.calendly_url IS
  'Mentor scheduling link (Calendly or Cal.com). Surfaced on sprint Week 1 + any inline "book a session" CTA.';


-- ============================================================================
-- SECTION 21: VISUAL ONBOARDING — ALPHA AWARDS + GUEST SESSIONS
--   Source: apps/web/sql/011_visual_onboarding.sql
-- ============================================================================

-- Visual Onboarding Migration
-- Adds tables for guest explore sessions and Alpha awards tracking

-- 1. Alpha awards tracking (new table)
CREATE TABLE IF NOT EXISTS alpha_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'explore_onboarding', 'referral', 'chat_streak', etc.
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_alpha_awards_user_id ON alpha_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_alpha_awards_source ON alpha_awards(source);

-- 2. Guest onboarding sessions for analytics (new table)
CREATE TABLE IF NOT EXISTS guest_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  interest TEXT NOT NULL,
  paths_generated JSONB,
  selected_path_index INTEGER,
  converted_user_id UUID REFERENCES profiles(id),
  variant TEXT DEFAULT 'mindmap',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for guest session lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_visitor_id ON guest_onboarding_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_converted ON guest_onboarding_sessions(converted_user_id);

-- 3. Extend profiles with onboarding fields

-- 4. RLS Policies for alpha_awards
ALTER TABLE alpha_awards ENABLE ROW LEVEL SECURITY;

-- Users can read their own awards
CREATE POLICY "Users can read own alpha awards"
  ON alpha_awards FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can insert (via service role)
CREATE POLICY "Service role can insert alpha awards"
  ON alpha_awards FOR INSERT
  WITH CHECK (true);

-- 5. RLS Policies for guest_onboarding_sessions
ALTER TABLE guest_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert guest sessions (no auth required for guests)
CREATE POLICY "Anyone can insert guest sessions"
  ON guest_onboarding_sessions FOR INSERT
  WITH CHECK (true);

-- Users can read sessions that converted to their account
CREATE POLICY "Users can read own converted sessions"
  ON guest_onboarding_sessions FOR SELECT
  USING (converted_user_id = auth.uid());

-- Service role can read/update all sessions
CREATE POLICY "Service can update guest sessions"
  ON guest_onboarding_sessions FOR UPDATE
  USING (true);

-- ============================================================================
-- SECTION 22: MESSAGING (chats, participants, messages, streaks, reports, blocks)
--   Source: supabase/migrations/20260201_messaging.sql
-- ============================================================================

-- Teen-to-teen messaging system (Snapchat-inspired)

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

-- ============================================================================
-- SECTION 23: PROFILE CUSTOMIZATIONS (MySpace-style theming)
--   Source: supabase/migrations/20260201_profile_customizations.sql
-- ============================================================================

-- Profile customization tables for MySpace-inspired profile pages

CREATE TABLE profile_customizations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Avatar
  avatar_type TEXT DEFAULT 'default' CHECK (avatar_type IN ('default','upload','preset')),
  avatar_preset TEXT,
  avatar_badges TEXT[] DEFAULT '{}',
  -- Banner
  banner_type TEXT DEFAULT 'color' CHECK (banner_type IN ('color','upload')),
  banner_color TEXT DEFAULT '#6366f1',
  banner_image_path TEXT,
  -- Interests
  interests TEXT[] DEFAULT '{}',
  -- Theme
  theme_palette TEXT DEFAULT 'indigo' CHECK (theme_palette IN ('indigo','teal','orange','hotpink','neon','dark')),
  theme_font TEXT DEFAULT 'inter' CHECK (theme_font IN ('inter','space-grotesk','poppins','jetbrains-mono','caveat')),
  -- Background
  bg_type TEXT DEFAULT 'default' CHECK (bg_type IN ('default','color','upload')),
  bg_color TEXT,
  bg_image_path TEXT,
  bg_tile BOOLEAN DEFAULT false,
  bg_overlay TEXT DEFAULT 'none' CHECK (bg_overlay IN ('none','glitter','stars','bubbles')),
  -- Music
  music_url TEXT,
  music_autoplay BOOLEAN DEFAULT false,
  -- Widgets (JSONB array)
  widgets JSONB DEFAULT '[]'::jsonb,
  -- Guided CSS overrides (structured JSONB, not raw CSS)
  css_overrides JSONB DEFAULT '{}'::jsonb,
  -- Privacy
  visibility TEXT DEFAULT 'basic' CHECK (visibility IN ('full','basic','private')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profile_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN (
    'badge_slot','widget_slot','effect','premium_music','font','bg_overlay','premium_preset'
  )),
  unlock_key TEXT NOT NULL,
  alpha_cost INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, unlock_type, unlock_key)
);

-- Indexes
CREATE INDEX idx_profile_customizations_visibility ON profile_customizations(visibility);
CREATE INDEX idx_profile_unlocks_user ON profile_unlocks(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_profile_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_customization_updated
  BEFORE UPDATE ON profile_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_customization_timestamp();

-- RLS Policies
ALTER TABLE profile_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own customization
CREATE POLICY "Users can read own customization"
  ON profile_customizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customization"
  ON profile_customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customization"
  ON profile_customizations FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can read non-private customizations (for public profiles)
CREATE POLICY "Public can read non-private customizations"
  ON profile_customizations FOR SELECT
  USING (visibility != 'private');

-- Mentors can read mentee customizations
CREATE POLICY "Mentors can read mentee customizations"
  ON profile_customizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.mentor_id = auth.uid()
      AND mentorships.teen_id = profile_customizations.user_id
      AND mentorships.status = 'active'
    )
  );

-- Users can read/write their own unlocks
CREATE POLICY "Users can read own unlocks"
  ON profile_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocks"
  ON profile_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for profile assets (avatars, banners, backgrounds)
-- Note: Create 'profile-assets' bucket in Supabase dashboard as public bucket
-- Storage policies:
-- - Public read access for all files
-- - Authenticated users can upload to their own folder: {user_id}/*

-- ============================================================================
-- SECTION 24: INCENTIVE SYSTEMS (Alpha coin economy: quests, ladders, tracker)
--   Source: supabase/migrations/20260131_incentive_systems.sql
-- ============================================================================

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

-- ============================================================================
-- SECTION 25: FIRST DOLLAR SPRINT (sprints + enrollments + tasks)
--   Source: supabase/migrations/20260324_first_dollar_sprint.sql
-- ============================================================================

-- Migration: First Dollar Sprint
-- 4-week mentored program where teens build something real and earn their first dollar

-- 1. Sprints table (program definitions)
CREATE TABLE public.sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL, -- cents (e.g., 14900 = $149)
  currency TEXT NOT NULL DEFAULT 'usd',
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  max_participants INTEGER NOT NULL DEFAULT 10,
  includes_session_hours NUMERIC(4,2) NOT NULL DEFAULT 1, -- mentor hours included (Week 1 session)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sprint enrollments (teen participation)
CREATE TABLE public.sprint_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- parent who paid
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'completed', 'dropped')),
  current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week BETWEEN 1 AND 4),
  project_title TEXT, -- what the teen chose to build
  project_description TEXT,
  first_dollar_earned BOOLEAN DEFAULT FALSE,
  first_dollar_amount INTEGER, -- cents
  first_dollar_method TEXT, -- how they earned it
  curriculum_requested_at TIMESTAMPTZ, -- prevents double curriculum generation
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(sprint_id, teen_id)
);

-- 3. Sprint weeks (curriculum per enrollment)
CREATE TABLE public.sprint_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.sprint_enrollments(id) ON DELETE CASCADE,
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 4),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'action' CHECK (task_type IN ('action', 'session', 'build', 'ship', 'earn')),
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  proof_text TEXT,
  proof_url TEXT, -- link to what they built/shipped
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Helper function: check if user is enrolled in sprint
CREATE OR REPLACE FUNCTION public.is_sprint_participant(p_sprint_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sprint_enrollments
    WHERE sprint_id = p_sprint_id
      AND (teen_id = auth.uid() OR family_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Helper function: check if user owns enrollment
CREATE OR REPLACE FUNCTION public.owns_sprint_enrollment(p_enrollment_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sprint_enrollments
    WHERE id = p_enrollment_id
      AND (teen_id = auth.uid() OR family_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. RLS Policies for sprints (public read, mentor manage)
CREATE POLICY "Anyone can view active sprints"
  ON public.sprints FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Mentors can manage their own sprints"
  ON public.sprints FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id);

-- Allow anon to view active sprints (for landing page)
CREATE POLICY "Anon can view active sprints"
  ON public.sprints FOR SELECT
  TO anon
  USING (status = 'active');

-- 8. RLS Policies for sprint_enrollments
CREATE POLICY "Participants can view their enrollments"
  ON public.sprint_enrollments FOR SELECT
  TO authenticated
  USING (teen_id = auth.uid() OR family_id = auth.uid());

CREATE POLICY "Mentors can view enrollments for their sprints"
  ON public.sprint_enrollments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sprints WHERE id = sprint_id AND mentor_id = auth.uid()
  ));

CREATE POLICY "Service role can manage enrollments"
  ON public.sprint_enrollments FOR ALL
  TO service_role
  USING (true);

-- Parents can enroll their teens
CREATE POLICY "Parents can create enrollments"
  ON public.sprint_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = family_id);

-- Participants can update their own enrollment (project details, first dollar)
CREATE POLICY "Participants can update their enrollments"
  ON public.sprint_enrollments FOR UPDATE
  TO authenticated
  USING (teen_id = auth.uid() OR family_id = auth.uid());

-- 9. RLS Policies for sprint_tasks
CREATE POLICY "Participants can view their tasks"
  ON public.sprint_tasks FOR SELECT
  TO authenticated
  USING (public.owns_sprint_enrollment(enrollment_id));

CREATE POLICY "Mentors can view tasks for their sprint enrollments"
  ON public.sprint_tasks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sprint_enrollments se
    JOIN public.sprints s ON se.sprint_id = s.id
    WHERE se.id = enrollment_id AND s.mentor_id = auth.uid()
  ));

CREATE POLICY "Teens can update their own tasks"
  ON public.sprint_tasks FOR UPDATE
  TO authenticated
  USING (public.owns_sprint_enrollment(enrollment_id));

CREATE POLICY "Service role can manage tasks"
  ON public.sprint_tasks FOR ALL
  TO service_role
  USING (true);

-- 10. Indexes
CREATE INDEX idx_sprints_mentor_id ON public.sprints(mentor_id);
CREATE INDEX idx_sprints_status ON public.sprints(status);
CREATE INDEX idx_sprint_enrollments_sprint_id ON public.sprint_enrollments(sprint_id);
CREATE INDEX idx_sprint_enrollments_teen_id ON public.sprint_enrollments(teen_id);
CREATE INDEX idx_sprint_enrollments_family_id ON public.sprint_enrollments(family_id);
CREATE INDEX idx_sprint_enrollments_status ON public.sprint_enrollments(status);
CREATE INDEX idx_sprint_tasks_enrollment_id ON public.sprint_tasks(enrollment_id);
CREATE INDEX idx_sprint_tasks_week ON public.sprint_tasks(week);
CREATE INDEX idx_sprint_tasks_status ON public.sprint_tasks(status);

-- 11. Grant permissions
GRANT ALL ON public.sprints TO authenticated;
GRANT ALL ON public.sprints TO service_role;
GRANT SELECT ON public.sprints TO anon;
GRANT ALL ON public.sprint_enrollments TO authenticated;
GRANT ALL ON public.sprint_enrollments TO service_role;
GRANT ALL ON public.sprint_tasks TO authenticated;
GRANT ALL ON public.sprint_tasks TO service_role;

-- 12. Add 'sprint' as a payment type
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('hourly', 'package', 'subscription', 'sprint'));

-- 13. Seed Steven Eno's First Dollar Sprint
DO $$
DECLARE
  steven_id UUID;
BEGIN
  SELECT id INTO steven_id FROM public.profiles WHERE is_default_mentor = TRUE LIMIT 1;

  IF steven_id IS NOT NULL THEN
    INSERT INTO public.sprints (mentor_id, title, description, price, duration_weeks, max_participants, includes_session_hours)
    VALUES (
      steven_id,
      'First Dollar Sprint',
      'Build something real in 4 weeks and earn your first dollar. Week 1: discover your project with a 1-on-1 mentor session. Weeks 2-3: build it with daily AI-powered tasks. Week 4: ship it and make your first sale.',
      14900, -- $149
      4,
      10,
      1 -- 1 hour mentor session included
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded First Dollar Sprint for Steven Eno (ID: %)', steven_id;
  ELSE
    RAISE NOTICE 'Steven Eno (default mentor) not found.';
  END IF;
END $$;

-- ============================================================================
-- SECTION 26: TEEN-PARENT VISIBILITY FIX
--   Source: supabase/migrations/20260412_fix_teen_parent_visibility.sql
-- ============================================================================

-- Fix: Teens can't see parent profiles on their dashboard.
-- The PendingParentRequests component joins family_connections to profiles,
-- but no RLS policy lets teens read parent profiles.

-- Allow teens to see profiles of parents connected to them
CREATE POLICY "Teens can view connected parent profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT parent_id FROM public.family_connections
      WHERE teen_id = auth.uid()
    )
  );

-- Simplify: auto-verify parent-teen connections on creation.
-- At current scale (<100 users), verification code adds friction without
-- meaningful safety benefit. Can be re-added later.
CREATE OR REPLACE FUNCTION public.set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code = public.generate_verification_code();
  END IF;
  -- Auto-verify the connection
  NEW.verified = TRUE;
  NEW.verified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 27: TEEN SEARCH FUNCTION
--   Source: supabase/migrations/20260412_search_teens_function.sql
-- ============================================================================

-- SECURITY DEFINER function to allow parents to search for teens by email.
-- This breaks the RLS catch-22 where parents can only see teen profiles
-- they're already connected to via family_connections.
-- The API route verifies the caller is a parent before calling this function.

CREATE OR REPLACE FUNCTION public.search_teens_by_email(search_email TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  grade TEXT,
  school TEXT,
  avatar_url TEXT
) AS $$
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.grade,
    p.school,
    p.avatar_url
  FROM public.profiles p
  WHERE p.role = 'teen'
    AND p.email ILIKE '%' || search_email || '%'
  LIMIT 10;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Also allow looking up a single teen by ID for the "add teen" connection flow.
-- Same RLS catch-22: parent can't read teen profile without existing connection.
CREATE OR REPLACE FUNCTION public.get_teen_profile(teen_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT
) AS $$
  SELECT p.id, p.role, p.full_name
  FROM public.profiles p
  WHERE p.id = teen_id
    AND p.role = 'teen'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 28: TEEN-DISCOVER RLS
--   Source: apps/web/sql/create_teen_discover_rls.sql
-- ============================================================================

-- Teen Discovery RLS Policies
-- The discovery API uses a service role client to read cross-user data,
-- so these policies are for future use if discovery moves to client-side queries.

-- Ensure profiles are readable by authenticated users (already exists in most setups)
-- CREATE POLICY IF NOT EXISTS "Authenticated users can read basic profiles"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- Ensure profile_customizations visibility is respected
-- The API filters by visibility field:
--   'private' → excluded from results entirely
--   'basic'   → name + grade + match reasons only
--   'full'    → complete card with bio and interests

-- Ensure blocked_users table is queryable for exclusion
-- CREATE POLICY IF NOT EXISTS "Users can read own blocks"
--   ON blocked_users FOR SELECT
--   TO authenticated
--   USING (user_id = auth.uid() OR blocked_user_id = auth.uid());

-- Notes:
-- 1. The discovery API currently uses service_role to bypass RLS for
--    reading candidate profiles, gaming_analysis, social_media_analysis,
--    startup_pathways, ambition_goals, and ladder_members.
-- 2. If migrating to client-side queries, add SELECT policies on each
--    table scoped to authenticated users with role = 'teen'.
-- 3. The profile_customizations.visibility field is the primary privacy
--    control — always filter on it regardless of RLS.

-- ============================================================================
-- SECTION 29: INCENTIVE TABLES RLS FIXES
--   Source: apps/web/sql/fix_rls_incentive_tables.sql
-- ============================================================================

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
  RAISE NOTICE '  - alpha_awards';
  RAISE NOTICE '  - guest_onboarding_sessions';
  RAISE NOTICE '  - chats, chat_participants, messages, chat_streaks, chat_reports, blocked_users';
  RAISE NOTICE '  - profile_customizations, profile_unlocks';
  RAISE NOTICE '  - incentive_assignments, quests, user_quest_progress';
  RAISE NOTICE '  - ladders, ladder_members, challenges, challenge_completions';
  RAISE NOTICE '  - ambition_goals, daily_tracks, incentive_events';
  RAISE NOTICE '  - sprints, sprint_enrollments, sprint_tasks';
  RAISE NOTICE '';
  RAISE NOTICE 'Profile column extensions:';
  RAISE NOTICE '  - onboarding_interest, onboarding_completed_at, onboarding_alpha_awarded';
  RAISE NOTICE '  - calendly_url (mentor scheduling link)';
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
