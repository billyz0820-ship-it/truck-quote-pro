-- 创建快递订单主表
CREATE TABLE IF NOT EXISTS public.express_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  customer_code TEXT NOT NULL,
  
  -- 发货信息
  warehouse TEXT NOT NULL,
  carrier TEXT NOT NULL,
  service_type TEXT NOT NULL,
  signature_service TEXT,
  reference_number TEXT,
  tracking_number TEXT,
  logistics_account TEXT,
  
  -- 订单来源
  order_source TEXT,
  
  -- 收件信息
  country TEXT NOT NULL DEFAULT 'US',
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  zip_code TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  address_type TEXT CHECK (address_type IN ('residential', 'commercial', 'mixed')),
  
  -- 费用信息
  shipping_fee NUMERIC DEFAULT 0,
  zone TEXT,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'pending_label' CHECK (status IN ('pending_label', 'labeled', 'in_transit', 'delivered', 'cancelled')),
  logistics_status TEXT,
  
  -- 备注和时间
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  label_printed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 创建包裹信息表
CREATE TABLE IF NOT EXISTS public.express_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.express_orders(id) ON DELETE CASCADE,
  
  -- 包裹信息
  package_type TEXT,
  product_sku TEXT,
  weight NUMERIC NOT NULL,
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  unit_system TEXT NOT NULL DEFAULT 'imperial' CHECK (unit_system IN ('imperial', 'metric')),
  
  -- 申报信息
  declared_value NUMERIC,
  origin_country TEXT DEFAULT 'CN',
  
  -- 保险信息
  insurance_fee NUMERIC DEFAULT 0,
  insurance_amount NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.express_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.express_packages ENABLE ROW LEVEL SECURITY;

-- 快递订单RLS策略
CREATE POLICY "管理员可以查看所有快递订单"
  ON public.express_orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以插入快递订单"
  ON public.express_orders FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以更新快递订单"
  ON public.express_orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "管理员可以删除快递订单"
  ON public.express_orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "客户可以查看自己的快递订单"
  ON public.express_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.user_id = auth.uid()
        AND customer_users.customer_id = express_orders.customer_id
    )
  );

CREATE POLICY "客户可以插入自己的快递订单"
  ON public.express_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.user_id = auth.uid()
        AND customer_users.customer_id = express_orders.customer_id
    )
  );

-- 包裹信息RLS策略
CREATE POLICY "管理员可以管理所有包裹信息"
  ON public.express_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "客户可以查看自己订单的包裹信息"
  ON public.express_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM express_orders eo
      JOIN customer_users cu ON cu.customer_id = eo.customer_id
      WHERE eo.id = express_packages.order_id
        AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "客户可以插入自己订单的包裹信息"
  ON public.express_packages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM express_orders eo
      JOIN customer_users cu ON cu.customer_id = eo.customer_id
      WHERE eo.id = express_packages.order_id
        AND cu.user_id = auth.uid()
    )
  );

-- 创建更新时间触发器
CREATE TRIGGER update_express_orders_updated_at
  BEFORE UPDATE ON public.express_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX idx_express_orders_customer_id ON public.express_orders(customer_id);
CREATE INDEX idx_express_orders_status ON public.express_orders(status);
CREATE INDEX idx_express_orders_tracking_number ON public.express_orders(tracking_number);
CREATE INDEX idx_express_orders_reference_number ON public.express_orders(reference_number);
CREATE INDEX idx_express_orders_order_number ON public.express_orders(order_number);
CREATE INDEX idx_express_packages_order_id ON public.express_packages(order_id);