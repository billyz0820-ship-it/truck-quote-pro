-- Add foreign key constraint from bills.customer_id to customers.id
ALTER TABLE public.bills 
ADD CONSTRAINT bills_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.customers(id) 
ON DELETE CASCADE;