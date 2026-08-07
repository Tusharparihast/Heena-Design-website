create table public.products (
  id text primary key,
  image text not null,
  gallery text[] not null default '{}',
  category text not null,
  price_npr integer not null,
  stock text not null default 'in' check (stock in ('in','low','out')),
  discount_pct integer check (discount_pct between 1 and 99),
  featured boolean not null default false,
  visible boolean not null default true,
  deleted boolean not null default false,
  name_en text not null,
  name_zh text not null default '',
  body_en text not null default '',
  body_zh text not null default '',
  features_en text[] not null default '{}',
  features_zh text[] not null default '{}',
  usage_en text[] not null default '{}',
  usage_zh text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_categories (
  id text primary key,
  name_en text not null,
  name_zh text not null default '',
  builtin boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.product_categories enable row level security;

create policy "Public can view live products"
  on public.products for select
  using (visible = true and deleted = false);

create policy "Admins can view all products"
  on public.products for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert products"
  on public.products for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update products"
  on public.products for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete products"
  on public.products for delete
  using (public.has_role(auth.uid(), 'admin'));

create policy "Public can view live categories"
  on public.product_categories for select
  using (deleted = false);

create policy "Admins can view all categories"
  on public.product_categories for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert categories"
  on public.product_categories for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update categories"
  on public.product_categories for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete categories"
  on public.product_categories for delete
  using (public.has_role(auth.uid(), 'admin'));
