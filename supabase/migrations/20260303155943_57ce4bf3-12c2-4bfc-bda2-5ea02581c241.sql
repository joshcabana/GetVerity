
-- 1. Restrict platform_stats to authenticated users only
DROP POLICY IF EXISTS "Anyone can view stats" ON public.platform_stats;
CREATE POLICY "Authenticated users can view stats"
  ON public.platform_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create a sanitized public profile view
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, user_id, display_name, avatar_url
  FROM public.profiles;

-- Grant access to the view for anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;
