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
  USING (public.is_sprint_participant(sprint_id) OR EXISTS (
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
