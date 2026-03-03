
-- Create user_payment_info table to isolate stripe_customer_id from public profiles
CREATE TABLE public.user_payment_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_payment_info ENABLE ROW LEVEL SECURITY;

-- Only the owner can see their own payment info
CREATE POLICY "Users can view own payment info"
  ON public.user_payment_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the owner can insert their own payment info
CREATE POLICY "Users can insert own payment info"
  ON public.user_payment_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own payment info
CREATE POLICY "Users can update own payment info"
  ON public.user_payment_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Deny delete
-- No DELETE policy needed — defaults to deny

-- Migrate existing stripe_customer_id data from profiles to user_payment_info
INSERT INTO public.user_payment_info (user_id, stripe_customer_id)
SELECT user_id, stripe_customer_id
FROM public.profiles
WHERE stripe_customer_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove stripe_customer_id from profiles table
ALTER TABLE public.profiles DROP COLUMN stripe_customer_id;

-- Add updated_at trigger
CREATE TRIGGER update_user_payment_info_updated_at
  BEFORE UPDATE ON public.user_payment_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
