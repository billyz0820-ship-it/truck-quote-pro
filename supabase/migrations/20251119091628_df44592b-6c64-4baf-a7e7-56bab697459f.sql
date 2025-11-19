-- 创建分销商表
CREATE TABLE public.distributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 为分销商表启用 RLS
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理分销商
CREATE POLICY "管理员可以管理分销商"
ON public.distributors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 为客户表添加新字段
ALTER TABLE public.customers
ADD COLUMN phone TEXT,
ADD COLUMN distributor_id UUID REFERENCES public.distributors(id);

-- 为优惠券表添加优惠券类型字段
ALTER TABLE public.coupons
ADD COLUMN coupon_type TEXT DEFAULT 'express',
ADD COLUMN order_type TEXT;

-- 添加订单使用的优惠券字段
ALTER TABLE public.express_orders
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN discount_amount NUMERIC DEFAULT 0;

ALTER TABLE public.orders
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- 创建系统配置表
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 为系统配置表启用 RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理系统配置
CREATE POLICY "管理员可以管理系统配置"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 所有用户可以查看系统配置
CREATE POLICY "所有用户可以查看系统配置"
ON public.system_settings
FOR SELECT
USING (true);

-- 插入默认的注册优惠券设置
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'registration_coupons',
  '{"express_amount": 2, "truck_amount": 7, "enabled": true}'::jsonb,
  '新用户注册自动发放的优惠券配置'
);

-- 创建自动生成邀请码的函数
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_distributors_updated_at
BEFORE UPDATE ON public.distributors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();