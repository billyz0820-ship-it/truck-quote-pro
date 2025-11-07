-- Create storage bucket for order documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS policies for order documents bucket
-- Admins can view all files
CREATE POLICY "Admins can view all order documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can upload files
CREATE POLICY "Admins can upload order documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'order-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update files
CREATE POLICY "Admins can update order documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'order-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete files
CREATE POLICY "Admins can delete order documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'order-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Customers can view their own order documents
CREATE POLICY "Customers can view their own order documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1
    FROM customer_users cu
    JOIN orders o ON o.customer_id = cu.customer_id
    WHERE cu.user_id = auth.uid()
    AND (storage.foldername(name))[1] = o.id::text
  )
);

-- Customers can upload their own order documents
CREATE POLICY "Customers can upload their own order documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1
    FROM customer_users cu
    JOIN orders o ON o.customer_id = cu.customer_id
    WHERE cu.user_id = auth.uid()
    AND (storage.foldername(name))[1] = o.id::text
  )
);