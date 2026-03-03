
-- ============================================================
-- FIX 1: Restrict profiles SELECT to self + admin only
-- Spark-matched users get limited data via a new RPC
-- ============================================================

-- Drop the current broad policy
DROP POLICY IF EXISTS "Users can view own and sparked profiles" ON public.profiles;

-- Self + admin only for direct table access
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- RPC: get limited profile data for a spark-matched user
CREATE OR REPLACE FUNCTION public.get_spark_partner_profile(_partner_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = _partner_user_id
    AND public.shares_spark_with(auth.uid(), _partner_user_id)
$$;

-- ============================================================
-- FIX 2: Replace plaintext DOB with age_verified boolean
-- ============================================================

-- Add age_verified column
ALTER TABLE public.user_trust
  ADD COLUMN IF NOT EXISTS age_verified boolean NOT NULL DEFAULT false;

-- Migrate existing data: if dob exists, mark as verified
UPDATE public.user_trust SET age_verified = true WHERE dob IS NOT NULL;

-- Drop the plaintext dob column
ALTER TABLE public.user_trust DROP COLUMN IF EXISTS dob;
