-- Migration: Stripe Payments for Mentor Hours
-- Run this in your Supabase SQL Editor

-- 1. Create mentor_pricing table (hourly rates per mentor)
CREATE TABLE IF NOT EXISTS public.mentor_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate INTEGER NOT NULL DEFAULT 10000, -- cents (e.g., 10000 = $100)
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id)
);

-- 2. Create hour_packages table (discounted bundles)
CREATE TABLE IF NOT EXISTS public.hour_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hours INTEGER NOT NULL,
  price INTEGER NOT NULL, -- cents
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create hour_balances table (family's purchased hours with each mentor)
CREATE TABLE IF NOT EXISTS public.hour_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_hours NUMERIC(10,2) NOT NULL DEFAULT 0, -- hours remaining (allows decimals for partial hours)
  total_purchased_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_used_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, mentor_id, teen_id)
);

-- 4. Create sessions table (booked mentor sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1, -- session duration in hours
  notes TEXT,
  mentor_notes TEXT,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 5. Create payments table (transaction history)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- cents
  currency TEXT NOT NULL DEFAULT 'usd',
  hours_purchased NUMERIC(10,2) NOT NULL,
  package_id UUID REFERENCES public.hour_packages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type TEXT NOT NULL DEFAULT 'hourly' CHECK (payment_type IN ('hourly', 'package', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. Enable RLS on all tables
ALTER TABLE public.mentor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for mentor_pricing
DROP POLICY IF EXISTS "Anyone can view mentor pricing" ON public.mentor_pricing;
CREATE POLICY "Anyone can view mentor pricing"
  ON public.mentor_pricing FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Mentors can update their own pricing" ON public.mentor_pricing;
CREATE POLICY "Mentors can update their own pricing"
  ON public.mentor_pricing FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id);

-- 8. RLS Policies for hour_packages
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.hour_packages;
CREATE POLICY "Anyone can view active packages"
  ON public.hour_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Mentors can manage their packages" ON public.hour_packages;
CREATE POLICY "Mentors can manage their packages"
  ON public.hour_packages FOR ALL
  TO authenticated
  USING (auth.uid() = mentor_id);

-- 9. RLS Policies for hour_balances
DROP POLICY IF EXISTS "Users can view their own hour balances" ON public.hour_balances;
CREATE POLICY "Users can view their own hour balances"
  ON public.hour_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = family_id OR auth.uid() = mentor_id OR auth.uid() = teen_id);

DROP POLICY IF EXISTS "Service role can manage hour balances" ON public.hour_balances;
CREATE POLICY "Service role can manage hour balances"
  ON public.hour_balances FOR ALL
  TO service_role
  USING (true);

-- 10. RLS Policies for sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = family_id OR auth.uid() = mentor_id OR auth.uid() = teen_id);

DROP POLICY IF EXISTS "Parents can create sessions" ON public.sessions;
CREATE POLICY "Parents can create sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = family_id);

DROP POLICY IF EXISTS "Mentors and parents can update sessions" ON public.sessions;
CREATE POLICY "Mentors and parents can update sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = family_id);

-- 11. RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = family_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
CREATE POLICY "Service role can manage payments"
  ON public.payments FOR ALL
  TO service_role
  USING (true);

-- 12. Create function to credit hours after payment
CREATE OR REPLACE FUNCTION public.credit_hours_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only credit hours when payment is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Insert or update hour balance
    INSERT INTO public.hour_balances (family_id, mentor_id, teen_id, balance_hours, total_purchased_hours)
    VALUES (NEW.family_id, NEW.mentor_id, NEW.teen_id, NEW.hours_purchased, NEW.hours_purchased)
    ON CONFLICT (family_id, mentor_id, teen_id)
    DO UPDATE SET
      balance_hours = hour_balances.balance_hours + NEW.hours_purchased,
      total_purchased_hours = hour_balances.total_purchased_hours + NEW.hours_purchased,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create trigger for crediting hours
DROP TRIGGER IF EXISTS credit_hours_trigger ON public.payments;
CREATE TRIGGER credit_hours_trigger
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_hours_after_payment();

-- 14. Create function to deduct hours when session is completed
CREATE OR REPLACE FUNCTION public.deduct_hours_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only deduct hours when session is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Deduct hours from balance
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

-- 15. Create trigger for deducting hours
DROP TRIGGER IF EXISTS deduct_hours_trigger ON public.sessions;
CREATE TRIGGER deduct_hours_trigger
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_hours_on_session_complete();

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_pricing_mentor_id ON public.mentor_pricing(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hour_packages_mentor_id ON public.hour_packages(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hour_packages_active ON public.hour_packages(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hour_balances_family_id ON public.hour_balances(family_id);
CREATE INDEX IF NOT EXISTS idx_hour_balances_mentor_id ON public.hour_balances(mentor_id);
CREATE INDEX IF NOT EXISTS idx_hour_balances_teen_id ON public.hour_balances(teen_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teen_id ON public.sessions(teen_id);
CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON public.sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON public.sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payments_family_id ON public.payments(family_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session ON public.payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 17. Grant permissions
GRANT ALL ON public.mentor_pricing TO authenticated;
GRANT ALL ON public.mentor_pricing TO service_role;
GRANT ALL ON public.hour_packages TO authenticated;
GRANT ALL ON public.hour_packages TO service_role;
GRANT ALL ON public.hour_balances TO authenticated;
GRANT ALL ON public.hour_balances TO service_role;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 18. Seed Steven Eno's pricing data
DO $$
DECLARE
  steven_id UUID;
BEGIN
  -- Find Steven Eno
  SELECT id INTO steven_id FROM public.profiles WHERE is_default_mentor = TRUE LIMIT 1;

  IF steven_id IS NOT NULL THEN
    -- Insert pricing ($100/hour)
    INSERT INTO public.mentor_pricing (mentor_id, hourly_rate, currency)
    VALUES (steven_id, 10000, 'usd')
    ON CONFLICT (mentor_id) DO UPDATE SET hourly_rate = 10000;

    -- Insert hour packages
    -- 5 hours for $450 (10% discount)
    INSERT INTO public.hour_packages (mentor_id, hours, price, name, description, is_active)
    VALUES (steven_id, 5, 45000, '5 Hour Package', 'Save $50 - 5 hours of mentoring', true)
    ON CONFLICT DO NOTHING;

    -- 10 hours for $850 (15% discount)
    INSERT INTO public.hour_packages (mentor_id, hours, price, name, description, is_active)
    VALUES (steven_id, 10, 85000, '10 Hour Package', 'Best value - Save $150 on 10 hours', true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded pricing for Steven Eno (ID: %)', steven_id;
  ELSE
    RAISE NOTICE 'Steven Eno (default mentor) not found. Run migration 002 first.';
  END IF;
END $$;

-- Verification queries:
-- Check mentor pricing:
-- SELECT mp.*, p.full_name FROM public.mentor_pricing mp JOIN public.profiles p ON mp.mentor_id = p.id;

-- Check hour packages:
-- SELECT hp.*, p.full_name FROM public.hour_packages hp JOIN public.profiles p ON hp.mentor_id = p.id;

-- Check hour balances:
-- SELECT * FROM public.hour_balances;

-- Check sessions:
-- SELECT s.*, m.full_name as mentor_name, t.full_name as teen_name
-- FROM public.sessions s
-- JOIN public.profiles m ON s.mentor_id = m.id
-- JOIN public.profiles t ON s.teen_id = t.id;
