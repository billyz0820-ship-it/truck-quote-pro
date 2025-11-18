-- 修复函数的 search_path 安全问题
CREATE OR REPLACE FUNCTION check_date_range_overlap()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM customer_carrier_pricing 
    WHERE customer_id = NEW.customer_id 
      AND carrier = NEW.carrier 
      AND is_active = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.effective_date_from, NEW.effective_date_to) OVERLAPS (effective_date_from, effective_date_to)
        OR (NEW.effective_date_from IS NULL AND effective_date_from IS NULL)
        OR (NEW.effective_date_to IS NULL AND effective_date_to IS NULL)
      )
  ) THEN
    RAISE EXCEPTION '时间段存在重叠，请检查配置';
  END IF;
  RETURN NEW;
END;
$$;