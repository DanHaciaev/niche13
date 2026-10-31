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
  ('ro', 'RO', 'RO', 'Коллекция', 'Collection', 'catalog', 'right', '/collection1.png', '/collection1.png', 10),
  ('ru', 'RU', 'RU', 'Коллекция', 'Collection', 'catalog', 'left', '/collection2.png', '/collection1.png', 20),
  ('en', 'EN', 'EN', 'Коллекция', 'Collection', 'catalog', 'right', '/collection3.png', '/collection1.png', 30),
  ('embroidery', 'Вышивка', 'Embroidery', 'Коллекция', 'Collection', 'catalog', 'left', '/collection4.png', '/collection1.png', 40),
  ('print', 'Принт', 'Print', 'Коллекция', 'Collection', 'catalog', 'right', '/collection5.png', '/collection1.png', 50),
  ('bucharest-in-passing', 'Bucharest in passing', 'Bucharest in passing', 'Коллекция', 'Collection', 'catalog', 'left', '/collection6.jpg', '/collection1.png', 60),
  ('one-of-one', 'One-of-one', 'One-of-one', '', '', 'one_of_one', 'feature', '/collection7.png', '/collection7.png', 70),
  ('illustrations', 'Иллюстрации', 'Illustrations', 'Коллекция', 'Collection', 'illustrations', 'left', '/collection9.jpg', '/collection8.jpg', 80)
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

-- ---------------------------------------------------------------------------
-- Categories without collections (e.g. Bags): the category page is the
-- product catalog itself, and products belong to the category directly.
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'has_collections'
  ) then
    alter table categories add column has_collections boolean not null default true;
    -- First run only: Bags is a plain catalog. Later changes made in the
    -- admin are never overwritten, because this block doesn't run again.
    update categories set has_collections = false where slug = 'bags';
    delete from collection_categories
    where category_id in (select id from categories where slug = 'bags');
  end if;
end $$;

alter table products add column if not exists category_id uuid references categories (id) on delete set null;
create unique index if not exists products_category_code_idx on products (category_id, code);
create index if not exists products_category_id_idx on products (category_id);

-- A product lives in a collection OR directly in a category, never both.
do $$ begin
  alter table products add constraint products_single_parent
    check (collection_id is null or category_id is null);
exception when duplicate_object then null; end $$;

-- Visitors see a product when its collection — or its category — is shown.
drop policy if exists "public read visible products" on products;
create policy "public read visible products" on products
  for select using (
    is_hidden = false
    and (
      exists (select 1 from collections c where c.id = collection_id and c.is_active)
      or exists (select 1 from categories k where k.id = category_id and k.is_active)
    )
  );


-- ---------------------------------------------------------------------------
-- All content lives in the database (nothing is hardcoded in the site).
-- ---------------------------------------------------------------------------

-- Collection page texts, edited in each collection's admin card. Empty means
-- "use the site-wide default" from Admin → Content.
alter table collections add column if not exists page_title_ru text not null default '';
alter table collections add column if not exists page_title_en text not null default '';
alter table collections add column if not exists request_text_ru text not null default '';
alter table collections add column if not exists request_text_en text not null default '';
alter table collections add column if not exists form_heading_ru text not null default '';
alter table collections add column if not exists form_heading_en text not null default '';

-- Starting values = the texts the site showed before. Only empty fields are
-- filled, so anything edited in the admin is never overwritten.
update collections set
  page_title_ru = 'Коллекция ' || title_ru,
  page_title_en = 'Collection ' || title_en
where kind = 'catalog' and page_title_ru = '' and page_title_en = '';

update collections set
  page_title_ru = case when page_title_ru = '' then 'Коллекция one - of - one' else page_title_ru end,
  page_title_en = case when page_title_en = '' then 'One - of - one collection' else page_title_en end,
  description_ru = case when description_ru = '' then 'Уникальные вещи, каждая создана лишь однажды. Никаких повторов, никаких вторых копий — только единственные в своём роде изделия, созданные принадлежать одному человеку. Однажды ставшая вашей, она остаётся только вашей.' else description_ru end,
  description_en = case when description_en = '' then 'Unique pieces, each created only once. No replicas, no second editions – just one-of-a-kind designs made to belong to one person. Once it''s yours, it''s yours alone.' else description_en end,
  request_text_ru = case when request_text_ru = '' then 'Коллекция уникальных вещей, каждая со своим характером. Продуманный дизайн, индивидуальное изготовление, созданы, чтобы выделяться. У каждой вещи своя история — ваша начинается, когда вы её находите.' else request_text_ru end,
  request_text_en = case when request_text_en = '' then 'A collection of one-of-a-kind pieces, each with its own character. Thoughtfully designed, individually crafted, and made to stand apart. Every piece has a story – yours begins when you find it.' else request_text_en end,
  form_heading_ru = case when form_heading_ru = '' then 'Найдите свою единственную' else form_heading_ru end,
  form_heading_en = case when form_heading_en = '' then 'Find your one' else form_heading_en end
where kind = 'one_of_one';

update collections set
  page_title_ru = case when page_title_ru = '' then 'Коллекция иллюстраций' else page_title_ru end,
  page_title_en = case when page_title_en = '' then 'Collection of Illustrations' else page_title_en end,
  description_ru = case when description_ru = '' then 'Исследуйте нашу подборку иллюстраций, созданных, чтобы придать характер каждой вещи. Выберите свой любимый дизайн и сделайте его своим с уникальной вышитой деталью.' else description_ru end,
  description_en = case when description_en = '' then 'Explore our curated collection of illustrations, thoughtfully designed to bring character to every piece. Choose your favourite design and make it yours with a unique embroidered detail.' else description_en end,
  request_text_ru = case when request_text_ru = '' then 'Изучите нашу коллекцию уникальных иллюстраций, выберите дизайн, который отзывается именно вам, и воплотите его в красиво вышитой вещи, созданной специально для вас.' else request_text_ru end,
  request_text_en = case when request_text_en = '' then 'Explore our collection of unique illustrations, choose the design that speaks to you, and bring it to life through a beautifully embroidered piece made just for you.' else request_text_en end,
  form_heading_ru = case when form_heading_ru = '' then 'Выберите свой дизайн' else form_heading_ru end,
  form_heading_en = case when form_heading_en = '' then 'Choose your design' else form_heading_en end
where kind = 'illustrations';

-- Site content (Admin → Content). "seed || saved": values already saved in the
-- admin win; missing or empty ones get the starting content.
update settings
set value = '{"aboutRu":"NICHE родился из любви к продуманным деталям, индивидуальному самовыражению и красоте вещей, созданных осознанно. Это больше, чем бренд одежды — это пространство, где творчество встречается с мастерством, а повседневные вещи становятся личными.\nЗа NICHE стоит идея сделать моду более индивидуальной — где каждая вышитая деталь рассказывает историю, отражает чувство или несёт собственный смысл.\nСоздан для тех, кто ценит сдержанные высказывания больше громких трендов, NICHE празднует индивидуальность через неподвластные времени вещи, осмысленный дизайн и искусство делать вещь по-настоящему своей.\nЭто не просто то, что вы носите. Это отражение того, кто вы есть.","aboutEn":"NICHE was born from a love for thoughtful details, individual expression, and the beauty of things made with intention. More than a clothing brand, it is a space where creativity meets craftsmanship, and everyday essentials become something personal.\nBehind NICHE is a vision of making fashion feel more individual — where every embroidered detail tells a story, reflects a feeling, or carries a meaning of its own.\nCreated for those who appreciate subtle statements over loud trends, NICHE celebrates individuality through timeless pieces, meaningful designs, and the art of making something truly yours.\nNot just what you wear. A reflection of who you are.","aboutImage":"/about.png","email":"hello@niche.com","instagramUrl":"https://instagram.com","sizeTables":[{"title":{"ru":"","en":""},"columns":[{"ru":"Размер","en":"Size"},{"ru":"Грудь (см)","en":"Chest (cm)"},{"ru":"Длина (см)","en":"Length (cm)"},{"ru":"Плечи (см)","en":"Shoulder (cm)"},{"ru":"Рукав (см)","en":"Sleeve (cm)"}],"rows":[["S","46","66","44","20"],["M","50","69","47","21"],["L","54","72","50","22"],["XL","58","75","53","23"],["2XL","62","78","56","24"],["3XL","66","81","59","25"]]}],"sizeIntro":{"ru":"Все замеры сняты в разложенном виде, в сантиметрах, и могут немного отличаться в зависимости от изделия. Если вы между размерами, рекомендуем брать размер больше для свободной посадки.","en":"All measurements are taken flat, in centimetres, and may vary slightly depending on the piece. If you''re between sizes, we recommend sizing up for a relaxed fit."},"sizeNote":{"ru":"Нужна помощь с выбором? Напишите нам, и мы поможем подобрать размер.","en":"Need help choosing? Reach out and we''ll help you find your fit."},"home":{"heroLeft":"/top1.jpg","heroRight":"/top2.jpg","news":["/middle_1.jpg","/middle_2.jpg","/middle_3.jpg","/middle_4.jpg","/middle_5.jpg"]},"footer":{"image":"/bottom_1.jpg","heading":{"ru":"Найдите свою вещь. Сделайте её своей.","en":"Find your piece. Make it yours."},"text":{"ru":"Выбирайте готовое или воплотите свою идею.\nСделайте вещь по-настоящему своей.","en":"Explore our designs or bring your own idea to life.\nMake it personal, make it yours."}},"contacts":{"title":{"ru":"Давайте знакомиться","en":"Let''s get in touch"},"subtitle":{"ru":"По вопросам, индивидуальным заказам\nи всему остальному","en":"For enquiries, custom designs\nand everything in between"},"customText":{"ru":"Есть идея?\nРасскажите нам о ней, и мы воплотим её в жизнь.","en":"Have something in mind?\nTell us about your idea and let''s bring it to life."}},"custom":{"heroTitle":{"ru":"Создайте свой Niche","en":"Customize your Niche"},"heroDescription":{"ru":"Есть идея дизайна? Принесите её в NICHE. Загрузите свою иллюстрацию, скетч или вдохновение и превратите идею в вещь, которую можно носить.\nОт личного символа до дизайна с особым смыслом — мы верим, что лучшие вещи рассказывают историю.","en":"Have a design in mind? Bring it to NICHE. Upload your illustration, sketch, or inspiration and turn your idea into something you can wear.\nFrom a personal symbol to a design that holds a special meaning, we believe the best pieces tell your story."},"requestText":{"ru":"Выберите изделие, поделитесь своим дизайном и расскажите, каким вы видите итоговое изделие. Мы рассмотрим вашу заявку и свяжемся с вами, чтобы обсудить детали воплощения идеи в жизнь. Ваша идея. Ваш дизайн. Ваш NICHE.","en":"Choose your garment, share your design, and tell us how you envision the final piece. We''ll review your request and get in touch to discuss the details of bringing your idea to life. Your idea. Your design. Your NICHE."},"formHeading":{"ru":"Воплотите свою идею в реальность","en":"Make your idea a reality"},"heroImage":"/collection7.png","tileTitle":{"ru":"Создать свой Niche","en":"Customize your Niche"},"tileImage":"/collection8.jpg"},"catalogDefaults":{"description":{"ru":"Откройте для себя коллекцию вышитых изделий, где вечная классика сочетается с продуманным мастерством. Каждая вещь объединяет простоту, индивидуальность и внимание к деталям.\nНайдите вещь, которая скажет о вас.","en":"Discover our collection of embroidered pieces, where timeless essentials meet thoughtful craftsmanship. Each piece brings together simplicity, individuality, and attention to detail.\nFind the piece that speaks to you."},"requestText":{"ru":"Изучите коллекцию,\nвыберите понравившееся и сделайте это своим.","en":"Explore the collection,\nchoose your favourites, and make them yours."},"formHeading":{"ru":"Найдите свою вещь","en":"Find your piece"}},"productDefaults":{"title":{"ru":"Вышитая футболка","en":"Embroidered tank t-shirt"},"description":{"ru":"Минималистичная футболка с деликатной вышивкой. Создана для повседневной носки, с отличительной деталью, которая делает её по-настоящему вашей.","en":"A minimalist tank top featuring delicate embroidery. Designed for everyday wear, with a distinctive detail that makes it uniquely yours."}},"seo":{"title":{"ru":"NICHE","en":"NICHE"},"description":{"ru":"NICHE — бренд одежды с вышивкой: футболки, худи и сумки, уникальные вещи и изделия по вашему дизайну. Найдите свою вещь и сделайте её своей.","en":"NICHE is an embroidered clothing brand: t-shirts, hoodies and bags, one-of-one pieces and custom designs made from your idea. Find your piece and make it yours."}}}'::jsonb || coalesce(
  (select jsonb_object_agg(k, v) from jsonb_each(value) as e(k, v) where v <> '""'::jsonb),
  '{}'::jsonb
)
where key = 'content';

update settings
set value = '{"categoryPlaceholder": "/top2.jpg"}'::jsonb || coalesce(
  (select jsonb_object_agg(k, v) from jsonb_each(value) as e(k, v) where v <> '""'::jsonb),
  '{}'::jsonb
)
where key = 'content';


-- ---------------------------------------------------------------------------
-- Starter products: 8 per collection and per category without collections,
-- the catalog the site showed before. Only on a database with no products.
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (select 1 from products) then
    insert into products (collection_id, code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
select p.id, v.code, v.description_ru, v.description_en, v.gender, v.price, v.discount_price, v.images, v.is_sold_out, v.sort_order
from (values
    ('001', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 1),
    ('002', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 2),
    ('003', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, true, 3),
    ('004', '', '', 'female', 400, 200, '["/clothes.jpg"]'::jsonb, false, 4),
    ('005', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 5),
    ('006', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 6),
    ('007', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 7),
    ('008', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 8)
  ) as v(code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
    cross join collections p where p.kind = 'catalog';

    insert into products (collection_id, code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
select p.id, v.code, v.description_ru, v.description_en, v.gender, v.price, v.discount_price, v.images, v.is_sold_out, v.sort_order
from (values
    ('001', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 1),
    ('002', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 2),
    ('003', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'male', 400, null, '["/clothes.jpg"]'::jsonb, true, 3),
    ('004', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'female', 400, 200, '["/clothes.jpg"]'::jsonb, false, 4),
    ('005', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 5),
    ('006', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 6),
    ('007', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 7),
    ('008', 'Уникальная в своём роде майка с отличительной вышивкой, превращающая классическую вещь в нечто личное. Минималистичная по форме, но неповторимая по характеру — эта вещь создана для тех, кто ценит индивидуальность в мельчайших деталях.
Доступна в размере S, длина 58 см и ширина груди 42 см. Замеры приблизительные.
Одна вещь, одна история.', 'A one-of-a-kind tank top featuring distinctive embroidery that turns a timeless essential into something personal. Minimalist in form, yet unique in character, this piece is designed for those who appreciate individuality in the smallest details.
Available in size S, with a length of 58 cm and a chest width of 42 cm. Measurements are approximate.
One piece, one story.', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 8)
  ) as v(code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
    cross join collections p where p.kind = 'one_of_one';

    insert into products (collection_id, code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
select p.id, v.code, v.description_ru, v.description_en, v.gender, v.price, v.discount_price, v.images, v.is_sold_out, v.sort_order
from (values
    ('001', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 1),
    ('002', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 2),
    ('003', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, true, 3),
    ('004', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, 200, '["/collection9.jpg"]'::jsonb, false, 4),
    ('005', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 5),
    ('006', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 6),
    ('007', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 7),
    ('008', 'Вдохновлённая молдавским наследием, эта иллюстрация объединяет культурную символику и неподвластное времени мастерство. Скромная дань местным традициям, переосмысленная для современного выражения и вышивки.', 'Inspired by Moldovan heritage, this illustration brings together cultural symbolism and timeless artistry. A subtle tribute to local traditions, reimagined for contemporary expression and embroidery.', null, 400, null, '["/collection9.jpg"]'::jsonb, false, 8)
  ) as v(code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
    cross join collections p where p.kind = 'illustrations';

    insert into products (category_id, code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
select p.id, v.code, v.description_ru, v.description_en, v.gender, v.price, v.discount_price, v.images, v.is_sold_out, v.sort_order
from (values
    ('001', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 1),
    ('002', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 2),
    ('003', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, true, 3),
    ('004', '', '', 'female', 400, 200, '["/clothes.jpg"]'::jsonb, false, 4),
    ('005', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 5),
    ('006', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 6),
    ('007', '', '', 'male', 400, null, '["/clothes.jpg"]'::jsonb, false, 7),
    ('008', '', '', 'female', 400, null, '["/clothes.jpg"]'::jsonb, false, 8)
  ) as v(code, description_ru, description_en, gender, price, discount_price, images, is_sold_out, sort_order)
    cross join categories p where p.has_collections = false;
  end if;
end $$;
