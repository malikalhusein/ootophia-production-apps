-- Add category and tea-specific fields to lineups table
ALTER TABLE public.lineups 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'coffee',
ADD COLUMN IF NOT EXISTS tea_type text,
ADD COLUMN IF NOT EXISTS tea_grade text,
ADD COLUMN IF NOT EXISTS harvest_season text,
ADD COLUMN IF NOT EXISTS processing_method text,
ADD COLUMN IF NOT EXISTS roasting_service_type text NOT NULL DEFAULT 'perKg';

-- Add check constraint for category
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_category_check CHECK (category IN ('coffee', 'tea'));

-- Add check constraint for tea_type
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_tea_type_check CHECK (tea_type IS NULL OR tea_type IN ('green', 'black', 'oolong', 'white', 'herbal', 'pu-erh'));

-- Add check constraint for tea_grade
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_tea_grade_check CHECK (tea_grade IS NULL OR tea_grade IN ('premium', 'standard', 'economy'));

-- Add check constraint for harvest_season
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_harvest_season_check CHECK (harvest_season IS NULL OR harvest_season IN ('spring', 'summer', 'autumn', 'winter'));

-- Add check constraint for processing_method
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_processing_method_check CHECK (processing_method IS NULL OR processing_method IN ('orthodox', 'ctc', 'blending', 'aging', 'fermentation'));

-- Add check constraint for roasting_service_type
ALTER TABLE public.lineups 
ADD CONSTRAINT lineups_roasting_service_type_check CHECK (roasting_service_type IN ('perKg', 'perBatch'));

-- Update existing lineups to have category = 'coffee'
UPDATE public.lineups SET category = 'coffee' WHERE category IS NULL;