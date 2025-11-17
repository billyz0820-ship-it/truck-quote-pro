-- 更新退货订单状态
ALTER TABLE public.return_orders 
ALTER COLUMN status SET DEFAULT 'pending_label';

COMMENT ON COLUMN public.return_orders.status IS '状态: pending_label-待打单, labeled-已打单, in_transit-在途, delivered-已送达, cancelled-已取消';

-- 创建快递账号表
CREATE TABLE public.carrier_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  carrier TEXT NOT NULL,
  account_number TEXT NOT NULL,
  api_credentials JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建账套表（报价模板）
CREATE TABLE public.pricing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  carrier TEXT NOT NULL,
  description TEXT,
  base_prices JSONB NOT NULL DEFAULT '{}',
  ahs_weight JSONB NOT NULL DEFAULT '{}',
  ahs_dim JSONB NOT NULL DEFAULT '{}',
  ahs_packing JSONB NOT NULL DEFAULT '{}',
  oversize_commercial JSONB NOT NULL DEFAULT '{}',
  oversize_residential JSONB NOT NULL DEFAULT '{}',
  residential_fees JSONB NOT NULL DEFAULT '{}',
  remote_area_fees JSONB NOT NULL DEFAULT '{}',
  dim_factor NUMERIC,
  fuel_charge NUMERIC,
  unauthorized_fee NUMERIC,
  peak_surcharges JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建快递账号成本配置表
CREATE TABLE public.carrier_account_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.carrier_accounts(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  base_prices JSONB NOT NULL DEFAULT '{}',
  ahs_weight JSONB NOT NULL DEFAULT '{}',
  ahs_dim JSONB NOT NULL DEFAULT '{}',
  ahs_packing JSONB NOT NULL DEFAULT '{}',
  oversize_commercial JSONB NOT NULL DEFAULT '{}',
  oversize_residential JSONB NOT NULL DEFAULT '{}',
  residential_fees JSONB NOT NULL DEFAULT '{}',
  remote_area_fees JSONB NOT NULL DEFAULT '{}',
  dim_factor NUMERIC,
  fuel_charge NUMERIC,
  unauthorized_fee NUMERIC,
  peak_surcharges JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建快递商官方价格表
CREATE TABLE public.carrier_official_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier TEXT NOT NULL,
  effective_date DATE NOT NULL,
  base_prices JSONB NOT NULL DEFAULT '{}',
  ahs_weight JSONB NOT NULL DEFAULT '{}',
  ahs_dim JSONB NOT NULL DEFAULT '{}',
  ahs_packing JSONB NOT NULL DEFAULT '{}',
  oversize_commercial JSONB NOT NULL DEFAULT '{}',
  oversize_residential JSONB NOT NULL DEFAULT '{}',
  residential_fees JSONB NOT NULL DEFAULT '{}',
  remote_area_fees JSONB NOT NULL DEFAULT '{}',
  dim_factor NUMERIC,
  fuel_charge NUMERIC,
  unauthorized_fee NUMERIC,
  peak_surcharges JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建客户快递报价配置表
CREATE TABLE public.customer_carrier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  template_id UUID REFERENCES public.pricing_templates(id),
  custom_prices JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建偏远地址区域配置表
CREATE TABLE public.remote_area_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  zone_type TEXT NOT NULL,
  service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建打单规则表
CREATE TABLE public.shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  primary_account_id UUID REFERENCES public.carrier_accounts(id),
  fallback_accounts JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 添加索引
CREATE INDEX idx_carrier_accounts_status ON public.carrier_accounts(status);
CREATE INDEX idx_carrier_account_costs_account ON public.carrier_account_costs(account_id);
CREATE INDEX idx_carrier_official_prices_carrier ON public.carrier_official_prices(carrier);
CREATE INDEX idx_customer_carrier_pricing_customer ON public.customer_carrier_pricing(customer_id);
CREATE INDEX idx_remote_area_zones_carrier_zip ON public.remote_area_zones(carrier, zip_code);
CREATE INDEX idx_shipping_rules_priority ON public.shipping_rules(priority);

-- 添加触发器
CREATE TRIGGER update_carrier_accounts_updated_at
BEFORE UPDATE ON public.carrier_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_templates_updated_at
BEFORE UPDATE ON public.pricing_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_account_costs_updated_at
BEFORE UPDATE ON public.carrier_account_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_official_prices_updated_at
BEFORE UPDATE ON public.carrier_official_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_carrier_pricing_updated_at
BEFORE UPDATE ON public.customer_carrier_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_rules_updated_at
BEFORE UPDATE ON public.shipping_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 启用 RLS
ALTER TABLE public.carrier_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_account_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_official_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carrier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_area_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "管理员可以管理所有快递账号"
ON public.carrier_accounts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理所有账套"
ON public.pricing_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理账号成本"
ON public.carrier_account_costs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理官方价格"
ON public.carrier_official_prices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理客户报价"
ON public.customer_carrier_pricing FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理偏远地址"
ON public.remote_area_zones FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以管理打单规则"
ON public.shipping_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));