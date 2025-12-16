-- Create menu resources table for resource management
CREATE TABLE public.menu_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  code TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'menu', -- menu, group, function
  menu_type TEXT DEFAULT 'view', -- view, external_link
  menu_ownership TEXT NOT NULL DEFAULT 'customer', -- system, customer
  path TEXT,
  view_path TEXT,
  view_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.menu_resources(id) ON DELETE CASCADE,
  is_cacheable BOOLEAN DEFAULT true,
  is_closable BOOLEAN DEFAULT true,
  is_disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_resources ENABLE ROW LEVEL SECURITY;

-- Admin can manage all menu resources
CREATE POLICY "管理员可以管理菜单资源"
ON public.menu_resources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view active menu resources
CREATE POLICY "用户可以查看启用的菜单资源"
ON public.menu_resources
FOR SELECT
USING (is_disabled = false);

-- Create trigger for updated_at
CREATE TRIGGER update_menu_resources_updated_at
BEFORE UPDATE ON public.menu_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();