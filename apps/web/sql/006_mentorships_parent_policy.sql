-- Migration: Allow parents to view their teen's mentorships
-- Run this in your Supabase SQL Editor

-- Add policy for parents to view their connected teen's mentorships
DROP POLICY IF EXISTS "Parents can view their teen's mentorships" ON public.mentorships;

CREATE POLICY "Parents can view their teen's mentorships"
  ON public.mentorships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_connections fc
      WHERE fc.parent_id = auth.uid()
      AND fc.teen_id = mentorships.teen_id
      AND fc.verified = TRUE
    )
  );

-- Verification: Test the policy by checking if a parent can see their teen's mentors
-- Replace 'PARENT_USER_ID' and 'TEEN_ID' with actual UUIDs to test:
-- SELECT * FROM public.mentorships WHERE teen_id = 'TEEN_ID';
