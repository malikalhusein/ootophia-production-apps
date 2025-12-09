-- Create stock_adjustments table for audit trail
CREATE TABLE public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('manual', 'sale', 'return', 'correction', 'initial')),
  reason TEXT,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own stock adjustments"
ON public.stock_adjustments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock adjustments"
ON public.stock_adjustments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock adjustments"
ON public.stock_adjustments
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for better query performance
CREATE INDEX idx_stock_adjustments_product ON public.stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created ON public.stock_adjustments(created_at DESC);