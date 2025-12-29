-- Add display_name column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS display_name text;

-- Add comment for the column
COMMENT ON COLUMN public.user_roles.display_name IS '用户显示名称';