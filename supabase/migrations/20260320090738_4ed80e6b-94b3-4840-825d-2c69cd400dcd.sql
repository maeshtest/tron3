-- Add user_id to trading_bots so users can create their own bots
ALTER TABLE public.trading_bots ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Allow users to create their own bots
CREATE POLICY "Users can create their own bots"
ON public.trading_bots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view own bots (includes stopped)
DROP POLICY IF EXISTS "Users can view active bots" ON public.trading_bots;
CREATE POLICY "Users can view own bots"
ON public.trading_bots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own bots
CREATE POLICY "Users can update own bots"
ON public.trading_bots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own bots
CREATE POLICY "Users can delete own bots"
ON public.trading_bots
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);