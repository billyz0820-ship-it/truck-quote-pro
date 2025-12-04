-- Create platform warehouse pricing table
CREATE TABLE public.platform_warehouse_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_name TEXT NOT NULL,
  carrier_id UUID REFERENCES public.truck_carriers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- Amazon FBA, Wayfair CG, Walmart WFS, etc.
  region TEXT NOT NULL, -- 美东, 美西, etc.
  warehouse_code TEXT NOT NULL, -- FBA code like ABE8, TEB6
  warehouse_address TEXT,
  transit_time TEXT, -- 1-3 BUSINESS DAY
  min_pallets INTEGER NOT NULL DEFAULT 1,
  max_pallets INTEGER NOT NULL DEFAULT 7,
  price NUMERIC NOT NULL,
  max_dimensions TEXT, -- 40*48*72 1000LB
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_warehouse_pricing ENABLE ROW LEVEL SECURITY;

-- Admin can manage platform warehouse pricing
CREATE POLICY "管理员可以管理平台仓报价" 
ON public.platform_warehouse_pricing 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view active pricing
CREATE POLICY "所有用户可以查看平台仓报价" 
ON public.platform_warehouse_pricing 
FOR SELECT 
USING (is_active = true);

-- Create index for faster queries
CREATE INDEX idx_platform_warehouse_pricing_code ON public.platform_warehouse_pricing(warehouse_code);
CREATE INDEX idx_platform_warehouse_pricing_platform ON public.platform_warehouse_pricing(platform);