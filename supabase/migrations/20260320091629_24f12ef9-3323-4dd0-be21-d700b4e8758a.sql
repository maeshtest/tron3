CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Allow users to see platform bots (user_id IS NULL)
CREATE POLICY "Users can view platform bots"
ON public.trading_bots
FOR SELECT
TO authenticated
USING (user_id IS NULL);