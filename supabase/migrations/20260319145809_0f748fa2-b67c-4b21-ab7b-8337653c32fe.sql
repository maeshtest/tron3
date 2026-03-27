
-- Trading bots table
CREATE TABLE public.trading_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  crypto_id TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'market_making',
  status TEXT NOT NULL DEFAULT 'stopped',
  config JSONB NOT NULL DEFAULT '{"spread_percent": 0.5, "order_size": 0.1, "max_orders": 5}'::jsonb,
  total_trades INTEGER NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bot trade history
CREATE TABLE public.bot_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES public.trading_bots(id) ON DELETE CASCADE NOT NULL,
  crypto_id TEXT NOT NULL,
  side TEXT NOT NULL,
  price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for bots
CREATE POLICY "Admins can manage bots" ON public.trading_bots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage bot trades" ON public.bot_trades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view bots (read-only for order book)
CREATE POLICY "Users can view active bots" ON public.trading_bots FOR SELECT TO authenticated USING (status = 'running');
CREATE POLICY "Users can view bot trades" ON public.bot_trades FOR SELECT TO authenticated USING (true);

-- Admin can view ALL transactions (not just own)
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can UPDATE transactions (approve/reject withdrawals)
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all wallets
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all wallets (for crediting/debiting on approval)
CREATE POLICY "Admins can update all wallets" ON public.wallets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert wallets for any user
CREATE POLICY "Admins can insert wallets" ON public.wallets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage user roles
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for bot_trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_trades;
