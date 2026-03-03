
-- Create private voice-intros storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-intros', 'voice-intros', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload to their own user_id/ folder
CREATE POLICY "Users can upload own voice intros"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-intros'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Spark participants can read voice intros
-- We extract the spark_id from the path pattern: user_id/spark_id/filename.webm
CREATE POLICY "Spark participants can listen to voice intros"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-intros'
  AND public.is_spark_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
);
