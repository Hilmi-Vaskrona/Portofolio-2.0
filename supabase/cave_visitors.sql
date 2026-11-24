-- Jalankan skrip ini satu kali di Supabase SQL Editor untuk membuat tabel pengunjung Goa Rahasia (/secret)

create table if not exists public.cave_visitors (
  id bigint generated always as identity primary key,
  visitor_uid uuid not null unique,
  city text not null default '-',
  country text not null default '-',
  location text not null default '-',
  browser text not null default 'Web Browser',
  os text not null default 'Unknown OS',
  device_type text not null default 'Desktop / Laptop',
  entered_at timestamptz not null default now()
);

alter table public.cave_visitors enable row level security;

drop policy if exists "Allow public read cave visitors" on public.cave_visitors;
create policy "Allow public read cave visitors"
  on public.cave_visitors
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public insert cave visitors" on public.cave_visitors;
create policy "Allow public insert cave visitors"
  on public.cave_visitors
  for insert
  to anon, authenticated
  with check (
    char_length(city) <= 80
    and char_length(country) <= 80
    and char_length(location) <= 120
    and char_length(browser) <= 80
    and char_length(os) <= 80
    and char_length(device_type) <= 80
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cave_visitors'
  ) then
    alter publication supabase_realtime add table public.cave_visitors;
  end if;
end $$;
