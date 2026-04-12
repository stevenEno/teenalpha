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
