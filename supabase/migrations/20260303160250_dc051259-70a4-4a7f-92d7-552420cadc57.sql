
-- Create a security definer function to check if two users share a spark
CREATE OR REPLACE FUNCTION public.shares_spark_with(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sparks
    WHERE (user_a = _viewer_id AND user_b = _profile_user_id)
       OR (user_b = _viewer_id AND user_a = _profile_user_id)
  )
$$;

-- Replace the broad authenticated SELECT policy with a scoped one
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own and sparked profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.shares_spark_with(auth.uid(), user_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
