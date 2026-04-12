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
