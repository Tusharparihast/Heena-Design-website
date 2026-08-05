drop policy if exists "Anyone can submit a booking request" on public.bookings;
create policy "Anyone can submit a booking request"
on public.bookings
for insert
to public
with check (true);

drop policy if exists "Anyone can submit an order request" on public.order_requests;
create policy "Anyone can submit an order request"
on public.order_requests
for insert
to public
with check (true);

notify pgrst, 'reload schema';