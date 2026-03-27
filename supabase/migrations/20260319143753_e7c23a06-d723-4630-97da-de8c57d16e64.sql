-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create site_settings table for dynamic admin config
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can read site settings"
ON public.site_settings
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Admins can insert settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"Tronnlix"'),
  ('support_email', '"support@tronnlix.com"'),
  ('enabled_cryptos', '["bitcoin","ethereum","tether","solana","binancecoin","ripple","cardano","dogecoin"]'),
  ('deposit_wallets', '{"tether":{"address":"TFYBTBoknjnZsYQKSPG2kjsAsZVNR8fkWB","network":"TRC20","recommended":true},"bitcoin":{"address":"bc1qhxj7jt0mcljnn6h0qxcjey3g237phss9zmmnrq"},"ethereum":{"address":"0x8d3007b24c93347adD0C503E886f53585D10F2CB"},"binancecoin":{"address":"0x8d3007b24c93347adD0C503E886f53585D10F2CB"},"ripple":{"address":"rMXG6jF9b9zsdGzgv2edDbdTsBHojGvF2b"},"solana":{"address":"9yZBBxPxUahdu4BJd5wz8SU4ZxVrgu7PvsDGUjGciCwm"},"cardano":{"address":"addr1qyu3t0yatnsk2sv4varh7f2jwc7404uzztqc2dkunzzr7nwtdkxk9zdruk90g4l99r7uxuqyk308fhnarl07zt4texzs97q9fg"}}'),
  ('min_deposit', '10'),
  ('min_withdraw', '20'),
  ('withdraw_fee_percent', '1');