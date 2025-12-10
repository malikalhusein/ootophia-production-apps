-- Add bundle_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN bundle_id uuid REFERENCES public.bundles(id) ON DELETE SET NULL;

-- Create index for bundle_id
CREATE INDEX idx_transactions_bundle_id ON public.transactions(bundle_id);