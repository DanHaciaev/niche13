-- Niche — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query → Run).
-- Safe to re-run: every statement is idempotent, and running it over the
-- previous version of this file upgrades the tables in place.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
-- Being signed in is NOT enough to manage the site: a user must also be listed
-- here. Add yourself after creating your user in Authentication → Users:
--
--   insert into admins (user_id, email)
--   select id, email from auth.users where email = 'you@example.com';

create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- security definer so policies can call it without the caller needing read
-- access to the admins table itself.
--
-- Two-factor: once an admin has turned on an authenticator app, a session
-- that only passed the password step (aal1) is NOT an admin here — so a
-- stolen password alone can't read or change anything, even via the API.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid())
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors
        where user_id = auth.uid() and status = 'verified'
      )
    );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- Failed sign-in attempts, for brute-force protection. Written and read only
-- by the server (service role); no policies, so the public API can't touch it.
create table if not exists admin_login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_ip_idx on admin_login_attempts (ip_hash, created_at desc);
create index if not exists admin_login_attempts_email_idx on admin_login_attempts (email_hash, created_at desc);

alter table admin_login_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text not null,
  created_at timestamptz not null default now()
);

alter table collections add column if not exists eyebrow_ru text not null default '';
alter table collections add column if not exists eyebrow_en text not null default '';
alter table collections add column if not exists description_ru text not null default '';
alter table collections add column if not exists description_en text not null default '';
alter table collections add column if not exists cover_image text;
alter table collections add column if not exists hero_image text;
alter table collections add column if not exists kind text not null default 'catalog';
alter table collections add column if not exists layout text not null default 'left';
alter table collections add column if not exists is_active boolean not null default true;
alter table collections add column if not exists sort_order integer not null default 0;

do $$ begin
  alter table collections add constraint collections_kind_check
    check (kind in ('catalog', 'one_of_one', 'illustrations'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table collections add constraint collections_layout_check
    check (layout in ('left', 'right', 'feature'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table collections add constraint collections_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products add column if not exists collection_id uuid references collections (id) on delete cascade;
alter table products add column if not exists code text;
alter table products add column if not exists title_ru text not null default '';
alter table products add column if not exists title_en text not null default '';
alter table products add column if not exists description_ru text not null default '';
alter table products add column if not exists description_en text not null default '';
alter table products add column if not exists gender text;
alter table products add column if not exists price numeric(10, 2);
alter table products add column if not exists discount_price numeric(10, 2);
alter table products add column if not exists currency text not null default 'MDL';
alter table products add column if not exists images jsonb not null default '[]'::jsonb;
alter table products add column if not exists sizes jsonb not null default '["S","M","L","XL","2XL","3XL"]'::jsonb;
alter table products add column if not exists colors jsonb not null default '["#17150f","#ffffff","#f5c518"]'::jsonb;
alter table products add column if not exists is_sold_out boolean not null default false;
-- Per-size stock, e.g. {"S": 3, "M": 0}. Only used when track_stock is on;
-- otherwise the product is simply available (or manually marked sold out).
alter table products add column if not exists track_stock boolean not null default false;
alter table products add column if not exists stock_by_size jsonb not null default '{}'::jsonb;
alter table products add column if not exists is_hidden boolean not null default false;
alter table products add column if not exists sort_order integer not null default 0;

-- Older versions of this schema had a NOT NULL product slug; codes replace it.
do $$ begin
  alter table products alter column slug drop not null;
exception when undefined_column then null; end $$;

do $$ begin
  alter table products add constraint products_gender_check
    check (gender is null or gender in ('male', 'female'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table products add constraint products_code_format
    check (code is null or code ~ '^[A-Za-z0-9-]{1,20}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table products add constraint products_price_check
    check ((price is null or price >= 0) and (discount_price is null or discount_price >= 0));
exception when duplicate_object then null; end $$;

create unique index if not exists products_collection_code_idx on products (collection_id, code);
create index if not exists products_collection_id_idx on products (collection_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Requests (order / custom-design enquiries sent from the site's forms)
-- ---------------------------------------------------------------------------

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'done', 'cancelled')),
  kind text not null
    check (kind in ('collection', 'custom', 'one_of_one', 'illustrations')),
  collection_slug text,
  locale text not null default 'ru',
  name text not null,
  email text,
  phone text,
  country text,
  -- Products added to the request from product pages: [{code,size,quantity,color}]
  items jsonb not null default '[]'::jsonb,
  -- Free-text form answers, keyed by field name.
  fields jsonb not null default '{}'::jsonb,
  comment text,
  attachment_path text,
  admin_note text not null default '',
  ip_hash text
);

create index if not exists requests_created_at_idx on requests (created_at desc);
create index if not exists requests_status_idx on requests (status);
create index if not exists requests_ip_hash_idx on requests (ip_hash, created_at desc);

drop trigger if exists requests_set_updated_at on requests;
create trigger requests_set_updated_at
  before update on requests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Settings & analytics
-- ---------------------------------------------------------------------------

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists page_views (
  id bigint generated always as identity primary key,
  path text not null,
  locale text not null,
  created_at timestamptz not null default now()
);

-- Daily-rotating hash of IP + user agent: counts unique visitors without
-- storing anything that identifies a person.
alter table page_views add column if not exists visitor text;

create index if not exists page_views_created_at_idx on page_views (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Public visitors (anon key) may only read what the site shows anyway.
-- Everything else needs is_admin(). Requests and page views are written by
-- the server with the service-role key after validation, never by browsers.

alter table admins enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table requests enable row level security;
alter table settings enable row level security;
alter table page_views enable row level security;

-- Remove policies from earlier versions of this file that trusted *any*
-- signed-in user. Harmless if they never existed.
drop policy if exists "admin full access collections" on collections;
drop policy if exists "admin full access products" on products;
drop policy if exists "admin full access settings" on settings;
drop policy if exists "admin read page_views" on page_views;
do $$ begin
  drop policy if exists "admin full access orders" on orders;
  drop policy if exists "admin full access order_items" on order_items;
exception when undefined_table then null; end $$;

drop policy if exists "admins read self" on admins;
create policy "admins read self" on admins
  for select using (user_id = auth.uid());

drop policy if exists "public read active collections" on collections;
create policy "public read active collections" on collections
  for select using (is_active = true);

drop policy if exists "admins manage collections" on collections;
create policy "admins manage collections" on collections
  for all using (is_admin()) with check (is_admin());

drop policy if exists "public read visible products" on products;
create policy "public read visible products" on products
  for select using (
    is_hidden = false
    and exists (select 1 from collections c where c.id = collection_id and c.is_active)
  );

drop policy if exists "admins manage products" on products;
create policy "admins manage products" on products
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins manage requests" on requests;
create policy "admins manage requests" on requests
  for all using (is_admin()) with check (is_admin());

drop policy if exists "public read content settings" on settings;
create policy "public read content settings" on settings
  for select using (key = 'content');

drop policy if exists "admins manage settings" on settings;
create policy "admins manage settings" on settings
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins read page_views" on page_views;
create policy "admins read page_views" on page_views
  for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('custom-orders', 'custom-orders', false, 10485760,
        array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin write product-images" on storage.objects;
drop policy if exists "admins manage product-images" on storage.objects;
create policy "admins manage product-images" on storage.objects
  for all using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "admin read custom-orders" on storage.objects;
drop policy if exists "admins read custom-orders" on storage.objects;
create policy "admins read custom-orders" on storage.objects
  for select using (bucket_id = 'custom-orders' and is_admin());

drop policy if exists "admins delete custom-orders" on storage.objects;
create policy "admins delete custom-orders" on storage.objects
  for delete using (bucket_id = 'custom-orders' and is_admin());

-- ---------------------------------------------------------------------------
-- Default settings
-- ---------------------------------------------------------------------------

insert into settings (key, value) values
  ('notifications', jsonb_build_object(
    'emailEnabled', false,
    'notifyEmail', '',
    'telegramEnabled', false,
    'telegramChatId', ''
  ))
on conflict (key) do nothing;

insert into settings (key, value) values
  ('content', '{}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Starter collections — the same ones the site shows before Supabase is
-- connected, so the catalog looks identical right after setup.
-- ---------------------------------------------------------------------------

insert into collections (slug, title_ru, title_en, eyebrow_ru, eyebrow_en, kind, layout, cover_image, hero_image, sort_order)
values
  ('ru', 'RU', 'RU', 'Коллекция', 'Collection', 'catalog', 'right', '/collection1.png', '/collection1.png', 10),
  ('en', 'EN', 'EN', 'Коллекция', 'Collection', 'catalog', 'left', '/collection2.png', '/collection1.png', 20),
  ('ro', 'RO', 'RO', 'Коллекция', 'Collection', 'catalog', 'right', '/collection3.png', '/collection1.png', 30),
  ('niche-feelings', 'Niche Feelings', 'Niche Feelings', '', '', 'catalog', 'feature', '/collection4.png', '/collection1.png', 40),
  ('with-name', '///', '///', 'Коллекция', 'Collection', 'catalog', 'left', '/collection5.png', '/collection1.png', 50),
  ('without-name', '///', '///', 'Коллекция', 'Collection', 'catalog', 'right', '/collection6.jpg', '/collection1.png', 60),
  ('one-of-one', 'One-of-one collection', 'One-of-one collection', '', '', 'one_of_one', 'feature', '/collection7.png', '/collection7.png', 70),
  ('illustrations', 'Иллюстрации', 'Illustrations', 'Коллекция', 'Collection', 'illustrations', 'left', '/collection8.jpg', '/collection8.jpg', 80)
on conflict (slug) do nothing;

-- Demo rows from the previous version of this file (no collection/code, so
-- they never appear on the site). Removed only if they are still untouched.
do $$ begin
  delete from products
  where code is null and collection_id is null
    and slug in ('one-of-one-hoodie', 'capsule-tee-01', 'classic-shirt');
exception when undefined_column then null; end $$;

delete from collections
where slug = 'autumn-capsule'
  and not exists (select 1 from products p where p.collection_id = collections.id);

-- ---------------------------------------------------------------------------
-- Statistics for the admin panel
-- ---------------------------------------------------------------------------
-- Aggregated in the database so the admin never downloads raw rows (and never
-- hits the API's 1000-row limit). security invoker: RLS on page_views still
-- applies, so for anyone but an admin these return zeros.

create or replace function admin_views_daily(days integer)
returns table (day date, views bigint, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select d::date, count(v.id), count(distinct v.visitor)
  from generate_series(current_date - (least(days, 366) - 1), current_date, interval '1 day') as d
  left join page_views v on v.created_at >= d and v.created_at < d + interval '1 day'
  group by d
  order by d;
$$;

create or replace function admin_views_summary(days integer)
returns table (views bigint, visitors bigint, views_ru bigint, views_en bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select count(*), count(distinct visitor),
         count(*) filter (where locale = 'ru'), count(*) filter (where locale = 'en')
  from page_views
  where created_at >= current_date - (least(days, 366) - 1);
$$;

create or replace function admin_top_pages(days integer, max_rows integer default 10)
returns table (path text, views bigint, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select path, count(*), count(distinct visitor)
  from page_views
  where created_at >= current_date - (least(days, 366) - 1)
  group by path
  order by count(*) desc
  limit least(max_rows, 50);
$$;

-- ---------------------------------------------------------------------------
-- Categories (T-shirts, Hoodies, Bags…) — the /collections page lists these,
-- and each category shows the collections linked to it. A collection can
-- belong to several categories.
-- ---------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text not null default '',
  image text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table categories add constraint categories_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
exception when duplicate_object then null; end $$;

create table if not exists collection_categories (
  collection_id uuid not null references collections (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  primary key (collection_id, category_id)
);

create index if not exists collection_categories_category_idx on collection_categories (category_id);

alter table categories enable row level security;
alter table collection_categories enable row level security;

drop policy if exists "public read active categories" on categories;
create policy "public read active categories" on categories
  for select using (is_active = true);

drop policy if exists "admins manage categories" on categories;
create policy "admins manage categories" on categories
  for all using (is_admin()) with check (is_admin());

drop policy if exists "public read collection categories" on collection_categories;
create policy "public read collection categories" on collection_categories
  for select using (true);

drop policy if exists "admins manage collection categories" on collection_categories;
create policy "admins manage collection categories" on collection_categories
  for all using (is_admin()) with check (is_admin());

-- Starter categories. Every starter collection is linked to each of them so
-- no category opens empty — untick what doesn't belong in the admin.
insert into categories (slug, title_ru, title_en, image, sort_order) values
  ('t-shirts', 'Футболки', 'T-shirts', '/middle_4.jpg', 10),
  ('hoodies', 'Худи', 'Hoodies', '/middle_2.jpg', 20),
  ('bags', 'Сумки', 'Bags', '/collection2.png', 30)
on conflict (slug) do nothing;

-- Starter categories created by an earlier version of this file all used
-- the same placeholder photo; give them the design's photos. Categories whose
-- photo was changed in the admin are left alone.
update categories set image = case slug
    when 't-shirts' then '/middle_4.jpg'
    when 'hoodies' then '/middle_2.jpg'
    when 'bags' then '/collection2.png'
  end
where slug in ('t-shirts', 'hoodies', 'bags') and image = '/top2.jpg';

insert into collection_categories (collection_id, category_id)
select c.id, k.id
from collections c
cross join categories k
where k.slug in ('t-shirts', 'hoodies', 'bags')
  and not exists (select 1 from collection_categories)
on conflict do nothing;
