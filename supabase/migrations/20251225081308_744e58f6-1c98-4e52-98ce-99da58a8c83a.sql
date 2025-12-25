-- Create freight_differences table to store imported carrier bill differences
CREATE TABLE public.freight_differences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Import batch info
  batch_id UUID NOT NULL,
  import_date DATE NOT NULL DEFAULT CURRENT_DATE,
  imported_by UUID NOT NULL,
  
  -- Carrier bill data (from import)
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  carrier_billed_weight NUMERIC,
  carrier_billed_length NUMERIC,
  carrier_billed_width NUMERIC,
  carrier_billed_height NUMERIC,
  carrier_billed_zone TEXT,
  carrier_base_fee NUMERIC DEFAULT 0,
  carrier_fuel_surcharge NUMERIC DEFAULT 0,
  carrier_residential_fee NUMERIC DEFAULT 0,
  carrier_remote_area_fee NUMERIC DEFAULT 0,
  carrier_oversize_fee NUMERIC DEFAULT 0,
  carrier_ahs_fee NUMERIC DEFAULT 0,
  carrier_peak_surcharge NUMERIC DEFAULT 0,
  carrier_other_fees NUMERIC DEFAULT 0,
  carrier_total_cost NUMERIC NOT NULL,
  
  -- Match result
  match_status TEXT NOT NULL DEFAULT 'pending', -- pending, matched, unmatched
  order_id UUID,
  customer_id UUID,
  customer_code TEXT,
  
  -- Original order data (from our system)
  original_weight NUMERIC,
  original_length NUMERIC,
  original_width NUMERIC,
  original_height NUMERIC,
  original_zone TEXT,
  original_shipping_fee NUMERIC,
  
  -- Difference analysis
  difference_type TEXT[], -- weight, dimension, zone, surcharge, not_found
  weight_difference NUMERIC,
  zone_difference TEXT, -- e.g. "3->5" 
  
  -- Recalculated customer charge (based on customer pricing)
  recalculated_base_fee NUMERIC DEFAULT 0,
  recalculated_fuel_surcharge NUMERIC DEFAULT 0,
  recalculated_residential_fee NUMERIC DEFAULT 0,
  recalculated_remote_area_fee NUMERIC DEFAULT 0,
  recalculated_oversize_fee NUMERIC DEFAULT 0,
  recalculated_ahs_fee NUMERIC DEFAULT 0,
  recalculated_peak_surcharge NUMERIC DEFAULT 0,
  recalculated_other_fees NUMERIC DEFAULT 0,
  recalculated_total NUMERIC DEFAULT 0,
  
  -- Final difference to charge customer
  difference_amount NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, disputed, resolved, billed
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import batches table to track each import
CREATE TABLE public.freight_difference_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT,
  carrier TEXT NOT NULL,
  import_date DATE NOT NULL DEFAULT CURRENT_DATE,
  imported_by UUID NOT NULL,
  file_name TEXT,
  total_records INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  total_difference NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, error
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.freight_differences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_difference_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin only
CREATE POLICY "管理员可以管理运费差异" 
ON public.freight_differences 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理导入批次" 
ON public.freight_difference_batches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_freight_differences_batch_id ON public.freight_differences(batch_id);
CREATE INDEX idx_freight_differences_tracking ON public.freight_differences(tracking_number);
CREATE INDEX idx_freight_differences_customer ON public.freight_differences(customer_id);
CREATE INDEX idx_freight_differences_match_status ON public.freight_differences(match_status);
CREATE INDEX idx_freight_differences_status ON public.freight_differences(status);

-- Trigger for updated_at
CREATE TRIGGER update_freight_differences_updated_at
BEFORE UPDATE ON public.freight_differences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_freight_difference_batches_updated_at
BEFORE UPDATE ON public.freight_difference_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();