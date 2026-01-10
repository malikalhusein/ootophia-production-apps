-- Create batches table (parent entity for lineups)
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  code TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for batches
CREATE POLICY "Users can view own batches" ON public.batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches" ON public.batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches" ON public.batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON public.batches
  FOR DELETE USING (auth.uid() = user_id);

-- Add batch_id to lineups table (nullable initially for existing data)
ALTER TABLE public.lineups ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;

-- Add lineup_code field for auto-generated codes like B05-LU01
ALTER TABLE public.lineups ADD COLUMN lineup_code TEXT;

-- Create trigger for updated_at on batches
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();