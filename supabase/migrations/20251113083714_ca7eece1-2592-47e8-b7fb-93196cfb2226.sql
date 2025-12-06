-- 1. Add order_number and carrier_name to tickets table
ALTER TABLE public.tickets 
ADD COLUMN order_number TEXT,
ADD COLUMN carrier_name TEXT,
ADD COLUMN attachments JSONB DEFAULT '[]';

-- 2. Create ticket_communications table for communication records
CREATE TABLE public.ticket_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_communications
ALTER TABLE public.ticket_communications ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_communications
CREATE POLICY "Admins can view all communications"
ON public.ticket_communications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert communications"
ON public.ticket_communications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view their ticket communications"
ON public.ticket_communications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    INNER JOIN public.customer_users cu ON cu.customer_id = t.customer_id
    WHERE t.id = ticket_communications.ticket_id
    AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can insert communications on their tickets"
ON public.ticket_communications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t
    INNER JOIN public.customer_users cu ON cu.customer_id = t.customer_id
    WHERE t.id = ticket_communications.ticket_id
    AND cu.user_id = auth.uid()
  )
);