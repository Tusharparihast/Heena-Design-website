DROP POLICY IF EXISTS "Anyone can submit a booking request" ON public.bookings;
CREATE POLICY "Anyone can submit a booking request" ON public.bookings
FOR INSERT TO anon, authenticated
WITH CHECK (
  trashed_at IS NULL
  AND char_length(btrim(name)) BETWEEN 1 AND 120
  AND char_length(contact) <= 200
  AND char_length(notes) <= 4000
  AND people BETWEEN 1 AND 100
  AND coalesce(array_length(reference_paths, 1), 0) <= 20
);

DROP POLICY IF EXISTS "Anyone can submit an order request" ON public.order_requests;
CREATE POLICY "Anyone can submit an order request" ON public.order_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND trashed_at IS NULL
  AND char_length(btrim(customer_name)) BETWEEN 1 AND 120
  AND char_length(address) <= 300
  AND char_length(notes) <= 1000
);

DROP POLICY IF EXISTS "Public can read site content" ON public.site_content;
CREATE POLICY "Public can read site content" ON public.site_content
FOR SELECT TO anon, authenticated
USING (key IS NOT NULL);

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings
FOR SELECT TO anon, authenticated
USING (id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.validate_site_settings()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.seo_ga_measurement_id <> '' AND NEW.seo_ga_measurement_id !~* '^(G|GT|AW|UA)-[A-Z0-9-]{4,20}$' THEN
    RAISE EXCEPTION 'Invalid Google Analytics measurement ID';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_site_settings_trg ON public.site_settings;
CREATE TRIGGER validate_site_settings_trg BEFORE INSERT OR UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.validate_site_settings();

DROP POLICY IF EXISTS "Visitors can upload reference images" ON storage.objects;
CREATE POLICY "Visitors can upload reference images" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'custom-design-refs'
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|heic|heif|avif)$'
);