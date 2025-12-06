-- 为 customer_carrier_pricing 添加时间段字段和版本管理
ALTER TABLE customer_carrier_pricing 
ADD COLUMN effective_date_from date,
ADD COLUMN effective_date_to date,
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN notes text;

-- 添加约束：确保同一客户和承运商的时间段不重复
CREATE UNIQUE INDEX unique_customer_carrier_date_range 
ON customer_carrier_pricing (customer_id, carrier, effective_date_from, effective_date_to)
WHERE is_active = true;

-- 为 pricing_templates 添加时间段字段（旺季附加费）
ALTER TABLE pricing_templates
ADD COLUMN peak_surcharge_periods jsonb DEFAULT '[]'::jsonb;

-- 创建函数检查时间段是否重叠
CREATE OR REPLACE FUNCTION check_date_range_overlap()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER check_pricing_date_overlap
BEFORE INSERT OR UPDATE ON customer_carrier_pricing
FOR EACH ROW
EXECUTE FUNCTION check_date_range_overlap();