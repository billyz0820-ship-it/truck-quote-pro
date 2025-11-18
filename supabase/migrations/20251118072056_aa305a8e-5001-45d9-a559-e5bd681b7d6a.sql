-- Add profitability_analysis column to customer_carrier_pricing
ALTER TABLE public.customer_carrier_pricing 
ADD COLUMN IF NOT EXISTS profitability_analysis jsonb DEFAULT '{}'::jsonb;

-- Create customer_pricing_notifications table
CREATE TABLE IF NOT EXISTS public.customer_pricing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  pricing_config_id uuid NOT NULL REFERENCES public.customer_carrier_pricing(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'price_change',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  effective_date date NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_pricing_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Admins can manage all notifications"
ON public.customer_pricing_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their notifications"
ON public.customer_pricing_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = customer_pricing_notifications.customer_id
  )
);

CREATE POLICY "Customers can update read status"
ON public.customer_pricing_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = customer_pricing_notifications.customer_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_users.user_id = auth.uid()
    AND customer_users.customer_id = customer_pricing_notifications.customer_id
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_customer_read 
ON public.customer_pricing_notifications(customer_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_effective_date 
ON public.customer_pricing_notifications(effective_date);

COMMENT ON TABLE public.customer_pricing_notifications IS 'Stores notifications for customer pricing changes';
COMMENT ON COLUMN public.customer_carrier_pricing.profitability_analysis IS 'Stores profitability analysis results comparing customer prices with costs';