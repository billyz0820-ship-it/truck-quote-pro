-- 给分销商表添加提成比例字段
ALTER TABLE public.distributors 
ADD COLUMN truck_commission_rate numeric DEFAULT 0,
ADD COLUMN express_commission_rate numeric DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN public.distributors.truck_commission_rate IS '卡车订单利润提成比例(%)';
COMMENT ON COLUMN public.distributors.express_commission_rate IS '快递订单利润提成比例(%)';