-- 1. Replace has_role() usage in policies with an inline, RLS-safe lookup so the
--    SECURITY DEFINER helper no longer needs to be callable from the API.

-- bookings
DROP POLICY IF EXISTS "Admins can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can view bookings" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- order_requests
DROP POLICY IF EXISTS "Admins can view order requests" ON public.order_requests;
DROP POLICY IF EXISTS "Admins can update order requests" ON public.order_requests;
DROP POLICY IF EXISTS "Admins can delete order requests" ON public.order_requests;
CREATE POLICY "Admins can view order requests" ON public.order_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update order requests" ON public.order_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete order requests" ON public.order_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- payment_methods
DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can insert payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can update payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can delete payment methods" ON public.payment_methods;
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can insert payment methods" ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update payment methods" ON public.payment_methods FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete payment methods" ON public.payment_methods FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- product_categories
DROP POLICY IF EXISTS "Admins can view all categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.product_categories;
CREATE POLICY "Admins can view all categories" ON public.product_categories FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can insert categories" ON public.product_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update categories" ON public.product_categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete categories" ON public.product_categories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- products
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 2. Lock the SECURITY DEFINER helper away from API callers.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

-- 3. Storage: customer design references are admin-only to read; uploads are
--    restricted to image files under random top-level names.
DROP POLICY IF EXISTS "Anyone can view reference images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload reference images" ON storage.objects;

CREATE POLICY "Admins can view reference images" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'custom-design-refs'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Visitors can upload reference images" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'custom-design-refs'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$'
    AND (metadata IS NULL OR (metadata->>'mimetype') IS NULL OR (metadata->>'mimetype') LIKE 'image/%')
  );
