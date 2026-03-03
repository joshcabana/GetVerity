
-- Create chemistry_replays table
CREATE TABLE public.chemistry_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id uuid NOT NULL REFERENCES public.sparks(id) ON DELETE CASCADE,
  call_id uuid NOT NULL REFERENCES public.calls(id),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  video_url text,
  duration_seconds integer NOT NULL DEFAULT 8,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chemistry_replays ENABLE ROW LEVEL SECURITY;

-- Participants can view their own replays
CREATE POLICY "Participants can view own replays"
  ON public.chemistry_replays
  FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Admins can manage all replays
CREATE POLICY "Admins can manage replays"
  ON public.chemistry_replays
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE for non-admins (server-only writes via service role)

-- Index for fast lookups by participant
CREATE INDEX idx_chemistry_replays_user_a ON public.chemistry_replays(user_a);
CREATE INDEX idx_chemistry_replays_user_b ON public.chemistry_replays(user_b);
CREATE INDEX idx_chemistry_replays_spark_id ON public.chemistry_replays(spark_id);
