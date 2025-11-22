-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  logo TEXT,
  theme_hue NUMERIC DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lineups table for coffee batches
CREATE TABLE public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  origin TEXT,
  process TEXT,
  variety TEXT,
  processor TEXT,
  roaster TEXT,
  tasting_notes TEXT,
  purchase_date DATE NOT NULL,
  initial_weight NUMERIC NOT NULL,
  green_beans_price NUMERIC DEFAULT 0,
  green_beans_shipping NUMERIC DEFAULT 0,
  roasting_service NUMERIC DEFAULT 0,
  roasting_transport NUMERIC DEFAULT 0,
  rnd_allocation NUMERIC DEFAULT 0,
  promo_allocation NUMERIC DEFAULT 0,
  rnd_allocation_used NUMERIC DEFAULT 0,
  promo_allocation_used NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create roast_logs table
CREATE TABLE public.roast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  input_weight NUMERIC NOT NULL,
  output_weight NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  net_weight NUMERIC NOT NULL,
  packaging_cost NUMERIC DEFAULT 0,
  label_cost NUMERIC DEFAULT 0,
  marketing_cost NUMERIC DEFAULT 0,
  margin_percentage NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundles table
CREATE TABLE public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundle_products junction table
CREATE TABLE public.bundle_products (
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (bundle_id, product_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sale', 'promo', 'rnd', 'bonus')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Lineups policies
CREATE POLICY "Users can view own lineups"
  ON public.lineups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lineups"
  ON public.lineups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lineups"
  ON public.lineups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lineups"
  ON public.lineups FOR DELETE
  USING (auth.uid() = user_id);

-- Roast logs policies
CREATE POLICY "Users can view own roast logs"
  ON public.roast_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = roast_logs.lineup_id
    AND lineups.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own roast logs"
  ON public.roast_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = roast_logs.lineup_id
    AND lineups.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own roast logs"
  ON public.roast_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = roast_logs.lineup_id
    AND lineups.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own roast logs"
  ON public.roast_logs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.lineups
    WHERE lineups.id = roast_logs.lineup_id
    AND lineups.user_id = auth.uid()
  ));

-- Products policies
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- Bundles policies
CREATE POLICY "Users can view own bundles"
  ON public.bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bundles"
  ON public.bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bundles"
  ON public.bundles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bundles"
  ON public.bundles FOR DELETE
  USING (auth.uid() = user_id);

-- Bundle products policies
CREATE POLICY "Users can view own bundle products"
  ON public.bundle_products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bundles
    WHERE bundles.id = bundle_products.bundle_id
    AND bundles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own bundle products"
  ON public.bundle_products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bundles
    WHERE bundles.id = bundle_products.bundle_id
    AND bundles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own bundle products"
  ON public.bundle_products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bundles
    WHERE bundles.id = bundle_products.bundle_id
    AND bundles.user_id = auth.uid()
  ));

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.lineups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name)
  VALUES (NEW.id, 'My Coffee Business');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();