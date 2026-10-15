create extension if not exists "pgcrypto";

create table plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null,
  has_orders boolean not null default false
);

create type restaurant_status as enum ('active', 'past_due', 'blocked', 'canceled');

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status restaurant_status not null default 'active',
  plan_id uuid not null references plans(id),
  tables_count integer not null default 10,
  logo_url text,
  created_at timestamptz not null default now()
);

create type user_role as enum ('master', 'restaurant_admin');

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  restaurant_id uuid references restaurants(id) on delete set null
);

create type payment_method as enum ('card', 'pix');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  plan_id uuid not null references plans(id),
  payment_method payment_method not null,
  gateway_customer_id text,
  gateway_subscription_id text,
  due_date date not null,
  grace_days integer not null default 2,
  status text not null default 'active'
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  gateway_payment_id text unique,
  amount_cents integer not null,
  status text not null,
  due_date date not null,
  paid_at timestamptz,
  payment_link_url text
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create type media_type as enum ('video', 'image');

create table dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  ingredients text,
  serves integer,
  prep_time_min integer,
  price_cents integer not null,
  media_type media_type not null default 'image',
  bunny_video_id text,
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0
);

create type event_type as enum ('view', 'add_to_cart', 'order');

create table events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  dish_id uuid not null references dishes(id) on delete cascade,
  session_id uuid not null,
  type event_type not null,
  duration_ms integer,
  completed boolean,
  created_at timestamptz not null default now()
);

create table likes (
  dish_id uuid not null references dishes(id) on delete cascade,
  session_id uuid not null,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  primary key (dish_id, session_id)
);

create type order_status as enum ('received', 'preparing', 'ready', 'delivered', 'canceled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_name text not null,
  table_number integer not null,
  status order_status not null default 'received',
  total_cents integer not null,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  dish_id uuid not null references dishes(id),
  name_snapshot text not null,
  unit_price_cents integer not null,
  quantity integer not null
);

create type waiter_call_status as enum ('open', 'attended');

create table waiter_calls (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number integer not null,
  session_id uuid,
  status waiter_call_status not null default 'open',
  created_at timestamptz not null default now(),
  attended_at timestamptz
);

create table cost_entries (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  description text not null,
  amount_cents integer not null,
  month date not null,
  created_at timestamptz not null default now()
);

create table usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  provider text not null,
  metric text not null,
  value numeric not null,
  recorded_at timestamptz not null default now()
);

create index on restaurants(slug);
create index on dishes(restaurant_id, is_available, sort_order);
create index on events(restaurant_id, dish_id, created_at);
create index on orders(restaurant_id, status, created_at);
create index on waiter_calls(restaurant_id, status);
