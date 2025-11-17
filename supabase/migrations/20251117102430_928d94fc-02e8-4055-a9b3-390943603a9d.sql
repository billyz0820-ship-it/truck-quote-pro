-- 创建价格计算历史表
CREATE TABLE IF NOT EXISTS public.price_calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'comparison',
  package_info JSONB NOT NULL,
  results JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.price_calculation_history ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有历史
CREATE POLICY "管理员可以查看所有计算历史"
ON public.price_calculation_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 用户可以查看自己的历史
CREATE POLICY "用户可以查看自己的计算历史"
ON public.price_calculation_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 用户可以插入自己的历史
CREATE POLICY "用户可以插入自己的计算历史"
ON public.price_calculation_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的历史
CREATE POLICY "用户可以删除自己的计算历史"
ON public.price_calculation_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 添加索引以提高查询性能
CREATE INDEX idx_price_calculation_history_user_id ON public.price_calculation_history(user_id);
CREATE INDEX idx_price_calculation_history_created_at ON public.price_calculation_history(created_at DESC);