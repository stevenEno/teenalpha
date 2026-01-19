-- Fix: Allow parents to search for teen profiles
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- Option 1: If you want to keep existing policies and just add parent search capability
-- This adds a new policy that allows parents to see teen profiles

DROP POLICY IF EXISTS "Parents can search for teens" ON public.profiles;
DROP POLICY IF EXISTS "Allow parents to search teens" ON public.profiles;

CREATE POLICY "Allow parents to search teens"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    role = 'teen'
    AND EXISTS (
      SELECT 1 FROM public.profiles searcher
      WHERE searcher.id = auth.uid() AND searcher.role = 'parent'
    )
  );

-- Option 2: If the above doesn't work, you may need a more permissive policy
-- Uncomment and run this if Option 1 doesn't work:

-- DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
-- CREATE POLICY "Authenticated users can view profiles"
--   ON public.profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- Quick test to verify it works (run as the parent user or use service role):
-- SELECT id, email, role, full_name FROM public.profiles WHERE role = 'teen' AND email ILIKE '%enob276%';
