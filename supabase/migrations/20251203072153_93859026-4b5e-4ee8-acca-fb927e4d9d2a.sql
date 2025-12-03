-- 卡车承运商表
CREATE TABLE public.truck_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_name TEXT NOT NULL,
  avatar_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 卡车承运商评分表
CREATE TABLE public.truck_carrier_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES public.truck_carriers(id) ON DELETE CASCADE,
  pickup_punctuality NUMERIC NOT NULL DEFAULT 0 CHECK (pickup_punctuality >= 0 AND pickup_punctuality <= 100),
  transit_timeliness NUMERIC NOT NULL DEFAULT 0 CHECK (transit_timeliness >= 0 AND transit_timeliness <= 100),
  delivery_timeliness NUMERIC NOT NULL DEFAULT 0 CHECK (delivery_timeliness >= 0 AND delivery_timeliness <= 100),
  loss_rate NUMERIC NOT NULL DEFAULT 0 CHECK (loss_rate >= 0 AND loss_rate <= 100),
  overall_score NUMERIC GENERATED ALWAYS AS ((pickup_punctuality + transit_timeliness + delivery_timeliness + (100 - loss_rate)) / 4) STORED,
  rated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 卡车承运商报价配置表
CREATE TABLE public.truck_carrier_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES public.truck_carriers(id) ON DELETE CASCADE,
  pricing_name TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  base_prices JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_surcharges JSONB NOT NULL DEFAULT '[]'::jsonb,
  accessorial_charges JSONB NOT NULL DEFAULT '[]'::jsonb,
  zone_table JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.truck_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_carrier_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_carrier_pricing ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "管理员可以管理卡车承运商" ON public.truck_carriers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "所有用户可以查看卡车承运商" ON public.truck_carriers FOR SELECT USING (true);

CREATE POLICY "管理员可以管理承运商评分" ON public.truck_carrier_ratings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "所有用户可以查看承运商评分" ON public.truck_carrier_ratings FOR SELECT USING (true);

CREATE POLICY "管理员可以管理承运商报价" ON public.truck_carrier_pricing FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "所有用户可以查看承运商报价" ON public.truck_carrier_pricing FOR SELECT USING (true);