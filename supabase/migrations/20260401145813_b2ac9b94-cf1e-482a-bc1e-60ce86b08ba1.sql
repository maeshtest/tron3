
-- Add network column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS network text;

-- Create withdrawal OTPs table
CREATE TABLE public.withdrawal_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  transaction_data jsonb NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own OTPs"
  ON public.withdrawal_otps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for cleanup
CREATE INDEX idx_withdrawal_otps_expires ON public.withdrawal_otps(expires_at);
