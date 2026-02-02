-- Teen Discovery RLS Policies
-- The discovery API uses a service role client to read cross-user data,
-- so these policies are for future use if discovery moves to client-side queries.

-- Ensure profiles are readable by authenticated users (already exists in most setups)
-- CREATE POLICY IF NOT EXISTS "Authenticated users can read basic profiles"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- Ensure profile_customizations visibility is respected
-- The API filters by visibility field:
--   'private' → excluded from results entirely
--   'basic'   → name + grade + match reasons only
--   'full'    → complete card with bio and interests

-- Ensure blocked_users table is queryable for exclusion
-- CREATE POLICY IF NOT EXISTS "Users can read own blocks"
--   ON blocked_users FOR SELECT
--   TO authenticated
--   USING (user_id = auth.uid() OR blocked_user_id = auth.uid());

-- Notes:
-- 1. The discovery API currently uses service_role to bypass RLS for
--    reading candidate profiles, gaming_analysis, social_media_analysis,
--    startup_pathways, ambition_goals, and ladder_members.
-- 2. If migrating to client-side queries, add SELECT policies on each
--    table scoped to authenticated users with role = 'teen'.
-- 3. The profile_customizations.visibility field is the primary privacy
--    control — always filter on it regardless of RLS.
