-- 1. 为 orders 表添加详细地址字段
ALTER TABLE public.orders 
ADD COLUMN pickup_address TEXT,
ADD COLUMN pickup_city TEXT,
ADD COLUMN pickup_state TEXT,
ADD COLUMN pickup_address_type TEXT,
ADD COLUMN pickup_contact_name TEXT,
ADD COLUMN pickup_contact_phone TEXT,
ADD COLUMN pickup_contact_email TEXT,
ADD COLUMN pickup_notes TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_city TEXT,
ADD COLUMN delivery_state TEXT,
ADD COLUMN delivery_address_type TEXT,
ADD COLUMN delivery_contact_name TEXT,
ADD COLUMN delivery_contact_phone TEXT,
ADD COLUMN delivery_contact_email TEXT,
ADD COLUMN delivery_notes TEXT;

-- 2. 创建地址配置表
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL, -- 'pickup' or 'delivery'
  name TEXT NOT NULL, -- 地址名称/标签
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  location_type TEXT NOT NULL, -- 'residential', 'commercial', 'warehouse'
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. 创建成本导入表
CREATE TABLE public.cost_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  carrier_name TEXT,
  actual_cost NUMERIC NOT NULL,
  import_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. 启用 RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_imports ENABLE ROW LEVEL SECURITY;

-- 5. 为 addresses 表创建 RLS 策略
CREATE POLICY "Admins can manage all addresses"
ON public.addresses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their own addresses"
ON public.addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = addresses.customer_id
  )
);

CREATE POLICY "Customers can manage their own addresses"
ON public.addresses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = addresses.customer_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = addresses.customer_id
  )
);

-- 6. 为 cost_imports 表创建 RLS 策略
CREATE POLICY "Admins can manage cost imports"
ON public.cost_imports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. 为 addresses 表创建更新触发器
CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();