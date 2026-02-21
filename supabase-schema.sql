-- =====================================================
-- Analytics Dashboard - Supabase Schema
-- انسخ هذا الكود وشغّله في Supabase SQL Editor
-- =====================================================

create table if not exists user_sites (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  site_url    text not null,
  display_name text not null,
  ga4_property_id text,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  unique(user_id, site_url)
);

-- Row Level Security
alter table user_sites enable row level security;

create policy "Users can manage their own sites"
  on user_sites
  for all
  using (true)
  with check (true);
