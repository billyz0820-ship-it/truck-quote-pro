-- 扩展 app_role 枚举类型，添加更多内部角色
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_service';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- 添加注释说明各角色用途
COMMENT ON TYPE public.app_role IS 'Application roles: admin (管理员), customer (客户), customer_service (客服), operations (运营), finance (财务), moderator (审核员)';

-- 为 user_roles 表添加额外的权限配置字段（如果需要更细粒度的权限控制）
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_roles.permissions IS 'Fine-grained permissions for the user, stored as JSON array';