
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crypto_id text NOT NULL,
  amount numeric NOT NULL,
  entry_type text NOT NULL,
  reference_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_user_crypto ON public.ledger_entries(user_id, crypto_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.ledger_entries(reference_id);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger entries" ON public.ledger_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ledger entries" ON public.ledger_entries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage ledger entries" ON public.ledger_entries
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_ledger_balance(p_user_id uuid, p_crypto_id text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0) FROM public.ledger_entries WHERE user_id = p_user_id AND crypto_id = p_crypto_id
$$;
