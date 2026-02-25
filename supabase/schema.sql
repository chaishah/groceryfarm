-- Enable UUID extension (usually already enabled on Supabase)
create extension if not exists "pgcrypto";

-- Lists table
create table lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  share_token text not null unique,
  created_at timestamptz default now() not null
);

-- Items table
create table items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid not null references lists(id) on delete cascade,
  name text not null,
  qty text,
  unit text,
  price numeric(10, 2),
  bought boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Migration: run these if upgrading an existing database
-- alter table items add column if not exists unit text;
-- alter table items add column if not exists price numeric(10, 2);

create index items_list_id_idx on items(list_id);

-- Row Level Security
alter table lists enable row level security;
alter table items enable row level security;

-- Allow anon access (token-in-URL is the access control; all ops go via server API routes)
create policy "public_lists" on lists for all to anon using (true) with check (true);
create policy "public_items" on items for all to anon using (true) with check (true);

-- Allow realtime for items (used by client-side subscriptions)
alter publication supabase_realtime add table items;
