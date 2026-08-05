create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null default 'appointment',
  name text not null,
  contact text not null default '',
  service text not null default '',
  booking_date text not null default '',
  booking_time text not null default '',
  people integer not null default 1,
  notes text not null default '',
  source text not null default 'other',
  status text not null default 'pending',
  locale text not null default 'en',
  details jsonb not null default '{}'::jsonb,
  trashed_at timestamptz
);

grant insert on public.bookings to anon;
grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;

alter table public.bookings enable row level security;

create policy "Anyone can submit a booking request"
on public.bookings
for insert
to anon, authenticated
with check (true);

create policy "Admins can view bookings"
on public.bookings
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update bookings"
on public.bookings
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete bookings"
on public.bookings
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null default '',
  wechat text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  contact_method text not null default 'wechat',
  items jsonb not null default '[]'::jsonb,
  total_npr integer,
  locale text not null default 'en',
  status text not null default 'new',
  trashed_at timestamptz
);

grant insert on public.order_requests to anon;
grant select, insert, update, delete on public.order_requests to authenticated;
grant all on public.order_requests to service_role;

alter table public.order_requests enable row level security;

create policy "Anyone can submit an order request"
on public.order_requests
for insert
to anon, authenticated
with check (true);

create policy "Admins can view order requests"
on public.order_requests
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update order requests"
on public.order_requests
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete order requests"
on public.order_requests
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));