
-- Add Agora Cloud Recording columns to calls table
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS recording_resource_id text,
  ADD COLUMN IF NOT EXISTS recording_sid text,
  ADD COLUMN IF NOT EXISTS recording_url text;
