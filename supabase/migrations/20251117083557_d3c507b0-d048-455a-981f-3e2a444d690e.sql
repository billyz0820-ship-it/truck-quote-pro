-- 创建退货订单表
CREATE TABLE IF NOT EXISTS public.return_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  customer_code TEXT NOT NULL,
  return_person TEXT NOT NULL,
  carrier TEXT NOT NULL,
  service_type TEXT NOT NULL,
  order_source TEXT,
  warehouse TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  zone TEXT,
  shipping_fee NUMERIC DEFAULT 0,
  address_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.return_orders ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有退货订单
CREATE POLICY "管理员可以查看所有退货订单" 
ON public.return_orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 管理员可以插入退货订单
CREATE POLICY "管理员可以插入退货订单" 
ON public.return_orders 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 管理员可以更新退货订单
CREATE POLICY "管理员可以更新退货订单" 
ON public.return_orders 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 管理员可以删除退货订单
CREATE POLICY "管理员可以删除退货订单" 
ON public.return_orders 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 客户可以查看自己的退货订单
CREATE POLICY "客户可以查看自己的退货订单" 
ON public.return_orders 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = return_orders.customer_id
  )
);

-- 客户可以插入自己的退货订单
CREATE POLICY "客户可以插入自己的退货订单" 
ON public.return_orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = return_orders.customer_id
  )
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_return_orders_customer_id ON public.return_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_return_orders_order_number ON public.return_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_return_orders_status ON public.return_orders(status);
CREATE INDEX IF NOT EXISTS idx_return_orders_created_at ON public.return_orders(created_at);

-- 添加更新时间触发器
CREATE TRIGGER update_return_orders_updated_at
BEFORE UPDATE ON public.return_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();