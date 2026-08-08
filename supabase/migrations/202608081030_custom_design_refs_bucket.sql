insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-design-refs', 'custom-design-refs', true, 5242880, array['image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "Anyone can upload reference images"
  on storage.objects for insert
  with check (bucket_id = 'custom-design-refs');

create policy "Anyone can view reference images"
  on storage.objects for select
  using (bucket_id = 'custom-design-refs');
