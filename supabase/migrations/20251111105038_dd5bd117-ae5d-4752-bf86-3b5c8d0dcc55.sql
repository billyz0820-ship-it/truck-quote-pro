-- 1. 添加客户表的创建时间和最近登录时间字段
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- 2. 修改orders表,添加shipment_type字段
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipment_type text DEFAULT 'LTL';

-- 3. 创建支出管理表
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  description text,
  expense_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. 创建账单表
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  bill_number text NOT NULL UNIQUE,
  bill_month text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bills"
ON public.bills
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. 修改rebills表,添加平台和卡司信息
ALTER TABLE public.rebills
ADD COLUMN IF NOT EXISTS platform_name text,
ADD COLUMN IF NOT EXISTS carrier_name text,
ADD COLUMN IF NOT EXISTS fee_type text;

-- 6. 创建子账号配置表
CREATE TABLE IF NOT EXISTS public.sub_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  customer_permissions jsonb DEFAULT '[]'::jsonb,
  feature_permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sub accounts"
ON public.sub_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. 创建工单表
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  customer_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_by uuid NOT NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tickets"
ON public.tickets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their tickets"
ON public.tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = tickets.customer_id
  )
);

-- 8. 创建知识库表
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  created_by uuid NOT NULL,
  updated_by uuid,
  status text NOT NULL DEFAULT 'published',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge base"
ON public.knowledge_base
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view published articles"
ON public.knowledge_base
FOR SELECT
USING (status = 'published');

-- 9. 创建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  notification_type text NOT NULL DEFAULT 'announcement',
  media_urls jsonb DEFAULT '[]'::jsonb,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active notifications"
ON public.notifications
FOR SELECT
USING (
  start_time <= now() AND 
  (end_time IS NULL OR end_time >= now())
);

-- 10. 创建邮件绑定表
CREATE TABLE IF NOT EXISTS public.email_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  email text NOT NULL,
  email_type text NOT NULL DEFAULT 'primary',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email bindings"
ON public.email_bindings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can manage their email bindings"
ON public.email_bindings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = email_bindings.customer_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = email_bindings.customer_id
  )
);

-- 11. 创建临时额度表
CREATE TABLE IF NOT EXISTS public.temporary_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  amount numeric NOT NULL,
  valid_until timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.temporary_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage temporary credits"
ON public.temporary_credits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 添加更新时间触发器
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_accounts_updated_at
BEFORE UPDATE ON public.sub_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();