-- Create agreements table (managed by admin, users must agree before first order)
CREATE TABLE public.agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create customer agreement records (tracks which agreements customers have accepted)
CREATE TABLE public.customer_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  UNIQUE(customer_id, agreement_id)
);

-- Create contracts table (for managing contracts with customers, distributors, channels)
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL, -- 'customer', 'distributor', 'channel'
  party_id UUID NOT NULL, -- references customer_id or distributor_id
  party_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'draft', 'active', 'expired', 'terminated'
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for agreements
CREATE POLICY "Everyone can view active agreements" ON public.agreements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage agreements" ON public.agreements
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for customer_agreements
CREATE POLICY "Customers can view their own agreements" ON public.customer_agreements
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM customer_users WHERE user_id = auth.uid() AND customer_id = customer_agreements.customer_id
  ));

CREATE POLICY "Customers can insert their own agreements" ON public.customer_agreements
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM customer_users WHERE user_id = auth.uid() AND customer_id = customer_agreements.customer_id
  ));

CREATE POLICY "Admins can manage customer agreements" ON public.customer_agreements
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for contracts
CREATE POLICY "Admins can manage contracts" ON public.contracts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view their own contracts" ON public.contracts
  FOR SELECT USING (
    contract_type = 'customer' AND EXISTS (
      SELECT 1 FROM customer_users WHERE user_id = auth.uid() AND customer_id = contracts.party_id
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();