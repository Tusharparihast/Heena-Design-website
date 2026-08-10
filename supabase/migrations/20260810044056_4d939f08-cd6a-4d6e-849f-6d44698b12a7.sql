CREATE OR REPLACE FUNCTION public.enforce_order_request_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  rebuilt jsonb := '[]'::jsonb;
  total integer := 0;
  p record;
  q integer;
  unit integer;
BEGIN
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;

  IF jsonb_array_length(NEW.items) = 0 OR jsonb_array_length(NEW.items) > 50 THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    SELECT id, name_en, price_npr, discount_pct
      INTO p
      FROM public.products
     WHERE id = (item->>'id')
       AND visible = true
       AND deleted = false;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown or unavailable product: %', COALESCE(item->>'id', '(none)');
    END IF;

    q := GREATEST(1, LEAST(99, COALESCE((item->>'qty')::numeric, 1)::integer));
    unit := ROUND(p.price_npr * (100 - COALESCE(p.discount_pct, 0))::numeric / 100);

    rebuilt := rebuilt || jsonb_build_object(
      'id', p.id,
      'name', p.name_en,
      'qty', q,
      'unit_price_npr', unit
    );
    total := total + unit * q;
  END LOOP;

  NEW.items := rebuilt;
  NEW.total_npr := total;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_order_request_pricing() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS order_requests_enforce_pricing ON public.order_requests;
CREATE TRIGGER order_requests_enforce_pricing
BEFORE INSERT ON public.order_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_request_pricing();