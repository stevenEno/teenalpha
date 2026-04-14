-- Migration: Add mentor workflow with Steven Eno as default mentor
-- Run this in your Supabase SQL Editor

-- 1. Create mentorships table
CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invitation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(mentor_id, teen_id)
);

-- 2. Enable RLS on mentorships
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Mentors can update their mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "System can insert mentorships" ON public.mentorships;

-- 4. Create RLS policies for mentorships
CREATE POLICY "Users can view their own mentorships"
  ON public.mentorships FOR SELECT
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = teen_id);

CREATE POLICY "Mentors can update their mentorships"
  ON public.mentorships FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id);

CREATE POLICY "Users can insert mentorships"
  ON public.mentorships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = teen_id);

-- 5. Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_default_mentor BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS max_mentees INTEGER DEFAULT 5;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expertise TEXT[];

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 6. Create Steven Eno as the default mentor
-- Note: This creates a profile row directly (you'll need to create the auth user separately)
DO $$
DECLARE
  steven_email TEXT := 'steveneno@hey.com';
  steven_id UUID;
BEGIN
  -- Check if Steven Eno already exists by email
  SELECT id INTO steven_id FROM public.profiles WHERE email = steven_email LIMIT 1;

  IF steven_id IS NULL THEN
    -- You need to create the auth.users entry first through Supabase Dashboard
    -- For now, we'll just create a placeholder that you can update
    RAISE NOTICE 'Please create auth user for steveneno@hey.com in Supabase Dashboard first';
  ELSE
    -- Update existing Steven Eno to be the default mentor
    UPDATE public.profiles
    SET
      role = 'mentor',
      full_name = 'Steven Eno',
      avatar_url = '/mentors/steve-eno.jpg',
      max_mentees = 999999,
      expertise = ARRAY['Technology', 'Entrepreneurship', 'Web Development', 'AI/ML', 'Career Guidance'],
      bio = 'I help teens turn what they''re already into into a real project that earns its first dollar. 16 years working with teens. Pick a path and let''s build.',
      is_default_mentor = TRUE
    WHERE id = steven_id;

    RAISE NOTICE 'Updated Steven Eno as default mentor with ID: %', steven_id;
  END IF;
END $$;

-- 7. Create function to auto-assign Steven Eno to new teens
CREATE OR REPLACE FUNCTION public.assign_default_mentor()
RETURNS TRIGGER AS $$
DECLARE
  default_mentor_id UUID;
BEGIN
  -- Only assign to teens
  IF NEW.role = 'teen' THEN
    -- Find Steven Eno (the default mentor)
    SELECT id INTO default_mentor_id
    FROM public.profiles
    WHERE is_default_mentor = TRUE
    LIMIT 1;

    IF default_mentor_id IS NOT NULL THEN
      -- Create mentorship relationship
      INSERT INTO public.mentorships (mentor_id, teen_id, status, invitation_message, accepted_at)
      VALUES (
        default_mentor_id,
        NEW.id,
        'active',
        'Steven Eno is your starter mentor. Message him whenever you''re ready to talk through a project idea.',
        NOW()
      )
      ON CONFLICT (mentor_id, teen_id) DO NOTHING;

      RAISE NOTICE 'Assigned default mentor to new teen: %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to fire after new profile is created
DROP TRIGGER IF EXISTS on_profile_created_assign_mentor ON public.profiles;
CREATE TRIGGER on_profile_created_assign_mentor
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_mentor();

-- 9. Create function to check mentor capacity
CREATE OR REPLACE FUNCTION public.check_mentor_capacity()
RETURNS TRIGGER AS $$
DECLARE
  mentor_max INTEGER;
  current_count INTEGER;
  is_default BOOLEAN;
BEGIN
  -- Get mentor's max_mentees setting and default status
  SELECT COALESCE(max_mentees, 5), COALESCE(is_default_mentor, FALSE)
  INTO mentor_max, is_default
  FROM public.profiles
  WHERE id = NEW.mentor_id;

  -- Skip check for default mentor (unlimited)
  IF is_default THEN
    RETURN NEW;
  END IF;

  -- Count current active mentees
  SELECT COUNT(*) INTO current_count
  FROM public.mentorships
  WHERE mentor_id = NEW.mentor_id
    AND status = 'active';

  -- Check capacity
  IF current_count >= mentor_max THEN
    RAISE EXCEPTION 'Mentor has reached maximum capacity of % mentees', mentor_max;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to check mentor capacity before inserting mentorship
DROP TRIGGER IF EXISTS check_mentor_capacity_trigger ON public.mentorships;
CREATE TRIGGER check_mentor_capacity_trigger
  BEFORE INSERT ON public.mentorships
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mentor_capacity();

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor_id ON public.mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_teen_id ON public.mentorships(teen_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON public.mentorships(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default_mentor ON public.profiles(is_default_mentor) WHERE is_default_mentor = TRUE;

-- 12. Grant permissions
GRANT ALL ON public.mentorships TO authenticated;
GRANT ALL ON public.mentorships TO service_role;

-- Verification queries
-- Run these after the migration to verify:
-- 1. Check if Steven Eno exists:
-- SELECT id, email, full_name, role, is_default_mentor FROM public.profiles WHERE is_default_mentor = TRUE;

-- 2. Check mentorships:
-- SELECT m.*, p1.full_name as mentor_name, p2.full_name as teen_name
-- FROM public.mentorships m
-- JOIN public.profiles p1 ON m.mentor_id = p1.id
-- JOIN public.profiles p2 ON m.teen_id = p2.id;
