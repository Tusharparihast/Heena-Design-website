create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  qr_image text not null,
  account_name text not null default '',
  account_number text not null default '',
  instructions text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "Public can view active payment methods"
  on public.payment_methods for select
  using (active = true);

create policy "Admins can view all payment methods"
  on public.payment_methods for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can insert payment methods"
  on public.payment_methods for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can update payment methods"
  on public.payment_methods for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can delete payment methods"
  on public.payment_methods for delete
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
