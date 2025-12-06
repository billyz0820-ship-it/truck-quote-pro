-- Add new FedEx surcharge fields to pricing tables
ALTER TABLE carrier_account_costs
ADD COLUMN IF NOT EXISTS signature_services jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_intercept_fee numeric,
ADD COLUMN IF NOT EXISTS address_correction_fee numeric,
ADD COLUMN IF NOT EXISTS dangerous_goods_fee numeric;

ALTER TABLE carrier_official_prices
ADD COLUMN IF NOT EXISTS signature_services jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_intercept_fee numeric,
ADD COLUMN IF NOT EXISTS address_correction_fee numeric,
ADD COLUMN IF NOT EXISTS dangerous_goods_fee numeric;

ALTER TABLE pricing_templates
ADD COLUMN IF NOT EXISTS signature_services jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_intercept_fee numeric,
ADD COLUMN IF NOT EXISTS address_correction_fee numeric,
ADD COLUMN IF NOT EXISTS dangerous_goods_fee numeric;

COMMENT ON COLUMN carrier_account_costs.signature_services IS 'Signature services including direct, indirect, and adult signature';
COMMENT ON COLUMN carrier_account_costs.delivery_intercept_fee IS 'Delivery intercept surcharge';
COMMENT ON COLUMN carrier_account_costs.address_correction_fee IS 'Address correction surcharge';
COMMENT ON COLUMN carrier_account_costs.dangerous_goods_fee IS 'Dangerous goods surcharge';