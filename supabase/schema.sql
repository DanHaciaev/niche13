-- Niche — Supabase schema
-- Run this once in the Supabase SQL editor of a fresh project.
-- Safe to re-run: uses "if not exists" / "on conflict do nothing" where sensible.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text not null,
  description_ru text not null default '',
  description_en text not null default '',
  cover_image text,
  is_limited boolean not null default true,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text not null,
  description_ru text not null default '',
  description_en text not null default '',
  price numeric(10, 2),
  discount_price numeric(10, 2),
  currency text not null default 'RUB',
  category text,
  images jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  is_limited boolean not null default false,
  limited_total integer,
  limited_remaining integer,
  is_one_of_one boolean not null default false,
  is_featured boolean not null default false,
  is_hidden boolean not null default false,
  stock integer,
  collection_id uuid references collections (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new'
    check (status in ('new', 'processing', 'done', 'cancelled')),
  customer_name text not null,
  phone text not null,
  email text,
  contact_method text not null
    check (contact_method in ('phone', 'whatsapp', 'telegram', 'email')),
  comment text,
  locale text not null default 'ru',
  notified_email boolean not null default false,
  notified_telegram boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  type text not null
    check (type in ('product', 'custom_print', 'custom_embroidery', 'consultation')),
  product_id uuid references products (id) on delete set null,
  title_snapshot text not null,
  size text,
  quantity integer not null default 1,
  price_snapshot numeric(10, 2),
  custom_image_path text,
  custom_description text,
  created_at timestamptz not null default now()
);

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

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists products_is_hidden_idx on products (is_hidden);
create index if not exists products_collection_id_idx on products (collection_id);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists page_views_created_at_idx on page_views (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger for products
-- ---------------------------------------------------------------------------

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
-- Row Level Security
-- ---------------------------------------------------------------------------
-- The public site reads published products/collections with the anon key.
-- All writes (orders, admin mutations) go through server actions using the
-- service role key, which always bypasses RLS. The "authenticated" policies
-- below are defense-in-depth only, in case an admin screen ever queries with
-- the logged-in user's own session instead of the service role client.

alter table collections enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;
alter table page_views enable row level security;

drop policy if exists "public read active collections" on collections;
create policy "public read active collections" on collections
  for select using (is_active = true);

drop policy if exists "admin full access collections" on collections;
create policy "admin full access collections" on collections
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "public read visible products" on products;
create policy "public read visible products" on products
  for select using (is_hidden = false);

drop policy if exists "admin full access products" on products;
create policy "admin full access products" on products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin full access orders" on orders;
create policy "admin full access orders" on orders
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin full access order_items" on order_items;
create policy "admin full access order_items" on order_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin full access settings" on settings;
create policy "admin full access settings" on settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- The "content" row (about/contacts/policy text) is safe for the public site
-- to read directly; the "notifications" row (email/Telegram destination)
-- stays admin-only via the policy above.
drop policy if exists "public read content settings" on settings;
create policy "public read content settings" on settings
  for select using (key = 'content');

drop policy if exists "admin read page_views" on page_views;
create policy "admin read page_views" on page_views
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('custom-orders', 'custom-orders', false)
on conflict (id) do nothing;

drop policy if exists "admin write product-images" on storage.objects;
create policy "admin write product-images" on storage.objects
  for all using (bucket_id = 'product-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "admin read custom-orders" on storage.objects;
create policy "admin read custom-orders" on storage.objects
  for select using (bucket_id = 'custom-orders' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Default settings row
-- ---------------------------------------------------------------------------

insert into settings (key, value) values
  ('notifications', jsonb_build_object(
    'emailEnabled', true,
    'telegramEnabled', true,
    'notifyEmail', '',
    'telegramChatId', ''
  ))
on conflict (key) do nothing;

insert into settings (key, value) values
  ('content', jsonb_build_object(
    'aboutRu', '', 'aboutEn', '',
    'contactsRu', '', 'contactsEn', '',
    'privacyPolicyRu', '', 'privacyPolicyEn', '',
    'termsRu', '', 'termsEn', '',
    'deliveryRu', '', 'deliveryEn', ''
  ))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Demo seed data (safe to delete from the admin panel later)
-- ---------------------------------------------------------------------------

insert into collections (slug, title_ru, title_en, description_ru, description_en, is_limited, is_active)
values (
  'autumn-capsule',
  'Осенняя капсула',
  'Autumn Capsule',
  'Малый тираж, посвящённый смене сезона.',
  'A small run marking the change of season.',
  true,
  true
)
on conflict (slug) do nothing;

insert into products (
  slug, title_ru, title_en, description_ru, description_en,
  price, discount_price, images, sizes,
  is_limited, limited_total, limited_remaining,
  is_one_of_one, is_featured, is_hidden, stock, collection_id, sort_order
)
select
  'one-of-one-hoodie',
  'Худи «Единственный экземпляр»',
  'One of One Hoodie',
  'Вещь, которая не повторится — ручная отделка, авторский крой.',
  'A piece that will not come again — hand-finished, original cut.',
  24900, null, '[]'::jsonb, '["S","M","L"]'::jsonb,
  false, null, null,
  true, true, false, 1, null, 0
where not exists (select 1 from products where slug = 'one-of-one-hoodie');

insert into products (
  slug, title_ru, title_en, description_ru, description_en,
  price, discount_price, images, sizes,
  is_limited, limited_total, limited_remaining,
  is_one_of_one, is_featured, is_hidden, stock, collection_id, sort_order
)
select
  'capsule-tee-01',
  'Футболка Capsule 01',
  'Capsule Tee 01',
  'Часть осенней капсульной коллекции.',
  'Part of the autumn capsule collection.',
  8900, null, '[]'::jsonb, '["XS","S","M","L","XL"]'::jsonb,
  true, 50, 37,
  false, true, false, null, (select id from collections where slug = 'autumn-capsule'), 1
where not exists (select 1 from products where slug = 'capsule-tee-01');

insert into products (
  slug, title_ru, title_en, description_ru, description_en,
  price, discount_price, images, sizes,
  is_limited, limited_total, limited_remaining,
  is_one_of_one, is_featured, is_hidden, stock, collection_id, sort_order
)
select
  'classic-shirt',
  'Рубашка Classic',
  'Classic Shirt',
  'Базовая вещь гардероба, сейчас со скидкой.',
  'A wardrobe staple, currently on sale.',
  12900, 9900, '[]'::jsonb, '["S","M","L","XL"]'::jsonb,
  false, null, null,
  false, true, false, null, null, 2
where not exists (select 1 from products where slug = 'classic-shirt');
