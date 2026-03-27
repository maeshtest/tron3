
-- Insert admin role for dereknash@usa.com
INSERT INTO public.user_roles (user_id, role) VALUES ('44e0f4ff-96b9-4ab1-b9ce-4f1b786da066', 'admin') ON CONFLICT (user_id, role) DO NOTHING;

-- Insert moderator role for mtuweba@gmail.com
INSERT INTO public.user_roles (user_id, role) VALUES ('8fd749e0-e28d-4d6f-b2a4-b9202cabc17a', 'moderator') ON CONFLICT (user_id, role) DO NOTHING;

-- Give both users 10000 USDT balance
INSERT INTO public.wallets (user_id, crypto_id, balance) VALUES 
  ('44e0f4ff-96b9-4ab1-b9ce-4f1b786da066', 'tether', 10000),
  ('8fd749e0-e28d-4d6f-b2a4-b9202cabc17a', 'tether', 10000)
ON CONFLICT DO NOTHING;

-- Also add USDT variant
INSERT INTO public.wallets (user_id, crypto_id, balance) VALUES 
  ('44e0f4ff-96b9-4ab1-b9ce-4f1b786da066', 'usdt', 10000),
  ('8fd749e0-e28d-4d6f-b2a4-b9202cabc17a', 'usdt', 10000)
ON CONFLICT DO NOTHING;

-- Ledger entries for the balances
INSERT INTO public.ledger_entries (user_id, crypto_id, amount, entry_type, description) VALUES
  ('44e0f4ff-96b9-4ab1-b9ce-4f1b786da066', 'tether', 10000, 'admin_credit', 'Initial admin balance'),
  ('44e0f4ff-96b9-4ab1-b9ce-4f1b786da066', 'usdt', 10000, 'admin_credit', 'Initial admin balance'),
  ('8fd749e0-e28d-4d6f-b2a4-b9202cabc17a', 'tether', 10000, 'admin_credit', 'Initial moderator balance'),
  ('8fd749e0-e28d-4d6f-b2a4-b9202cabc17a', 'usdt', 10000, 'admin_credit', 'Initial moderator balance');
