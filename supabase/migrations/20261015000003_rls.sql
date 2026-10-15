alter table plans enable row level security;
alter table restaurants enable row level security;
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table categories enable row level security;
alter table dishes enable row level security;
alter table events enable row level security;
alter table likes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table waiter_calls enable row level security;
alter table cost_entries enable row level security;
alter table usage_snapshots enable row level security;

-- plans
create policy "plans_read_all" on plans for select using (true);
create policy "plans_master_all" on plans for all using (get_my_role() = 'master');

-- restaurants
create policy "restaurants_anon_read_active" on restaurants
  for select using (status = 'active');

create policy "restaurants_admin_read_own" on restaurants
  for select using (id = get_my_restaurant_id());

create policy "restaurants_admin_update_own" on restaurants
  for update using (
    get_my_role() = 'restaurant_admin'
    and id = get_my_restaurant_id()
  );

create policy "restaurants_master_all" on restaurants
  for all using (get_my_role() = 'master');

-- profiles
create policy "profiles_self_read" on profiles
  for select using (user_id = auth.uid());

create policy "profiles_master_all" on profiles
  for all using (get_my_role() = 'master');

-- subscriptions
create policy "subscriptions_admin_read_own" on subscriptions
  for select using (restaurant_id = get_my_restaurant_id());

create policy "subscriptions_master_all" on subscriptions
  for all using (get_my_role() = 'master');

-- payments
create policy "payments_admin_read_own" on payments
  for select using (restaurant_id = get_my_restaurant_id());

create policy "payments_master_all" on payments
  for all using (get_my_role() = 'master');

-- categories
create policy "categories_anon_read_active" on categories
  for select using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.status = 'active'
    )
  );

create policy "categories_admin_all" on categories
  for all using (restaurant_id = get_my_restaurant_id());

create policy "categories_master_all" on categories
  for all using (get_my_role() = 'master');

-- dishes
create policy "dishes_anon_read_active" on dishes
  for select using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.status = 'active'
    )
  );

create policy "dishes_admin_all" on dishes
  for all using (restaurant_id = get_my_restaurant_id());

create policy "dishes_master_all" on dishes
  for all using (get_my_role() = 'master');

-- events: insert only via rpc_batch_events (security definer)
create policy "events_admin_read_own" on events
  for select using (restaurant_id = get_my_restaurant_id());

create policy "events_master_all" on events
  for all using (get_my_role() = 'master');

-- likes: insert only via rpc_toggle_like (security definer)
create policy "likes_admin_read_own" on likes
  for select using (restaurant_id = get_my_restaurant_id());

create policy "likes_master_all" on likes
  for all using (get_my_role() = 'master');

-- orders: insert only via rpc_create_order (security definer)
create policy "orders_admin_read_own" on orders
  for select using (restaurant_id = get_my_restaurant_id());

create policy "orders_admin_update_own" on orders
  for update using (
    get_my_role() = 'restaurant_admin'
    and restaurant_id = get_my_restaurant_id()
  );

create policy "orders_master_all" on orders
  for all using (get_my_role() = 'master');

-- order_items
create policy "order_items_admin_read_own" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
        and o.restaurant_id = get_my_restaurant_id()
    )
  );

create policy "order_items_master_all" on order_items
  for all using (get_my_role() = 'master');

-- waiter_calls: insert only via rpc_call_waiter (security definer)
create policy "waiter_calls_admin_read_own" on waiter_calls
  for select using (restaurant_id = get_my_restaurant_id());

create policy "waiter_calls_admin_update_own" on waiter_calls
  for update using (
    get_my_role() = 'restaurant_admin'
    and restaurant_id = get_my_restaurant_id()
  );

create policy "waiter_calls_master_all" on waiter_calls
  for all using (get_my_role() = 'master');

-- cost_entries / usage_snapshots: master only
create policy "cost_entries_master_all" on cost_entries
  for all using (get_my_role() = 'master');

create policy "usage_snapshots_master_all" on usage_snapshots
  for all using (get_my_role() = 'master');
