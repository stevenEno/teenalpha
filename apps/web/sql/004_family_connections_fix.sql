-- Fix: Add missing verification_code column to family_connections
-- Run this in your Supabase SQL Editor

-- 1. Add the verification_code column if it doesn't exist
ALTER TABLE public.family_connections
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- 2. Create function to generate verification code (if not exists)
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger function to set verification code on insert
CREATE OR REPLACE FUNCTION public.set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code = public.generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS set_family_verification_code ON public.family_connections;
CREATE TRIGGER set_family_verification_code
  BEFORE INSERT ON public.family_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_verification_code();

-- 5. Generate verification codes for any existing rows that don't have one
UPDATE public.family_connections
SET verification_code = public.generate_verification_code()
WHERE verification_code IS NULL;

-- Verify the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'family_connections' AND table_schema = 'public';
