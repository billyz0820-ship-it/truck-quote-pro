-- 创建工单状态变更历史表
CREATE TABLE public.ticket_status_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 添加索引
CREATE INDEX idx_ticket_status_changes_ticket_id ON public.ticket_status_changes(ticket_id);
CREATE INDEX idx_ticket_status_changes_created_at ON public.ticket_status_changes(created_at);

-- 启用RLS
ALTER TABLE public.ticket_status_changes ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有状态变更
CREATE POLICY "管理员可以查看所有状态变更"
ON public.ticket_status_changes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 管理员可以插入状态变更
CREATE POLICY "管理员可以插入状态变更"
ON public.ticket_status_changes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 客户可以查看自己工单的状态变更
CREATE POLICY "客户可以查看自己工单的状态变更"
ON public.ticket_status_changes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    JOIN public.customer_users cu ON cu.customer_id = t.customer_id
    WHERE t.id = ticket_status_changes.ticket_id
    AND cu.user_id = auth.uid()
  )
);

-- 更新tickets表，添加assigned_to字段的注释
COMMENT ON COLUMN public.tickets.assigned_to IS '工单处理人（只能是管理员用户）';
COMMENT ON COLUMN public.tickets.created_by IS '工单创建人（可以是客户或管理员）';