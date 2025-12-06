-- Add expire_at column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN expire_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.coupons.expire_at IS 'Expiration date for the coupon';