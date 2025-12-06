-- Add pallet information columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pallet_count integer,
ADD COLUMN IF NOT EXISTS pallet_info jsonb DEFAULT '[]'::jsonb;