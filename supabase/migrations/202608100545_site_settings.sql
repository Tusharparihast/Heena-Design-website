create table public.site_settings (
  id text primary key default 'main',
  seo_title_suffix text not null default '',
  seo_default_description text not null default '',
  seo_og_image text not null default '',
  seo_robots_index boolean not null default true,
  seo_ga_measurement_id text not null default '',
  seo_search_console_verification text not null default '',
  default_locale text not null default 'en' check (default_locale in ('en','zh')),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values ('main')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Public can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
