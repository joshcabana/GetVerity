
-- Fix: make the view SECURITY INVOKER so it respects RLS of the querying user
ALTER VIEW public.public_profiles SET (security_invoker = on);
