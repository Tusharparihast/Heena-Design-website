ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.order_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_requests;