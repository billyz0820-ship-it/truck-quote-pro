-- 创建充值记录表
CREATE TABLE IF NOT EXISTS public.recharge_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  voucher_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建物流服务表
CREATE TABLE IF NOT EXISTS public.logistics_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建物流触发规则表
CREATE TABLE IF NOT EXISTS public.logistics_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  carrier TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  fee_amount NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建渠道配置表
CREATE TABLE IF NOT EXISTS public.channel_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  warehouse TEXT NOT NULL,
  carrier TEXT NOT NULL,
  logistics_service TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.recharge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_configs ENABLE ROW LEVEL SECURITY;

-- 充值记录策略
CREATE POLICY "管理员可以管理充值记录" ON public.recharge_records
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "客户可以查看自己的充值记录" ON public.recharge_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.user_id = auth.uid()
      AND customer_users.customer_id = recharge_records.customer_id
    )
  );

CREATE POLICY "客户可以创建自己的充值记录" ON public.recharge_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.user_id = auth.uid()
      AND customer_users.customer_id = recharge_records.customer_id
    )
  );

-- 物流服务策略
CREATE POLICY "管理员可以管理物流服务" ON public.logistics_services
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "所有用户可以查看物流服务" ON public.logistics_services
  FOR SELECT USING (true);

-- 物流触发规则策略
CREATE POLICY "管理员可以管理物流触发规则" ON public.logistics_triggers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "所有用户可以查看物流触发规则" ON public.logistics_triggers
  FOR SELECT USING (true);

-- 渠道配置策略
CREATE POLICY "管理员可以管理渠道配置" ON public.channel_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "客户可以查看自己的渠道配置" ON public.channel_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.user_id = auth.uid()
      AND customer_users.customer_id = channel_configs.customer_id
    )
  );