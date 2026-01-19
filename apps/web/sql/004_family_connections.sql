-- Migration: Add family connections for parent-teen relationships
-- Run this in your Supabase SQL Editor

-- 1. Create family_connections table (with all columns)
CREATE TABLE IF NOT EXISTS public.family_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'parent',
  verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  UNIQUE(parent_id, teen_id)
);

-- 2. Add verification_code column if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'family_connections'
    AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE public.family_connections ADD COLUMN verification_code TEXT;
  END IF;
END $$;

-- 3. Enable RLS on family_connections
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their connections" ON public.family_connections;
DROP POLICY IF EXISTS "Parents can view their connections" ON public.family_connections;
DROP POLICY IF EXISTS "Teens can view their connections" ON public.family_connections;
DROP POLICY IF EXISTS "Parents can create connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can update their connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON public.family_connections;

-- 5. Create RLS policies for family_connections

-- Parents and teens can view their own connections
CREATE POLICY "Users can view their connections"
  ON public.family_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);

-- Parents can create connection requests
CREATE POLICY "Parents can create connections"
  ON public.family_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = parent_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

-- Both parties can update (for verification)
CREATE POLICY "Users can update their connections"
  ON public.family_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);

-- Either party can delete the connection
CREATE POLICY "Users can delete their connections"
  ON public.family_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_connections_parent_id ON public.family_connections(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_teen_id ON public.family_connections(teen_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_verified ON public.family_connections(verified);

-- 7. Grant permissions
GRANT ALL ON public.family_connections TO authenticated;
GRANT ALL ON public.family_connections TO service_role;

-- 8. Create function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger function to set verification code on insert
CREATE OR REPLACE FUNCTION public.set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code = public.generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS set_family_verification_code ON public.family_connections;
CREATE TRIGGER set_family_verification_code
  BEFORE INSERT ON public.family_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_verification_code();

-- 11. Generate verification codes for any existing rows that don't have one
UPDATE public.family_connections
SET verification_code = public.generate_verification_code()
WHERE verification_code IS NULL;

-- Verification: Check the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'family_connections' AND table_schema = 'public'
ORDER BY ordinal_position;
