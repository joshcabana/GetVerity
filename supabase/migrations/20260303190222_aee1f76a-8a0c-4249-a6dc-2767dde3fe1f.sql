CREATE TABLE public.guardian_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.guardian_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log own alerts"
  ON public.guardian_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all alerts"
  ON public.guardian_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));