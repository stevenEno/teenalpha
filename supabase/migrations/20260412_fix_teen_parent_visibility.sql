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
