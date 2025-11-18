-- 创建报价变更历史表
CREATE TABLE IF NOT EXISTS public.pricing_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID NOT NULL REFERENCES public.customer_carrier_pricing(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'activated', 'deactivated'
  change_reason TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 添加索引
CREATE INDEX idx_pricing_change_history_config ON public.pricing_change_history(pricing_config_id);
CREATE INDEX idx_pricing_change_history_customer ON public.pricing_change_history(customer_id);
CREATE INDEX idx_pricing_change_history_date ON public.pricing_change_history(changed_at DESC);

-- 启用RLS
ALTER TABLE public.pricing_change_history ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有变更历史
CREATE POLICY "管理员可以查看所有变更历史"
ON public.pricing_change_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 管理员可以插入变更历史
CREATE POLICY "管理员可以插入变更历史"
ON public.pricing_change_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));