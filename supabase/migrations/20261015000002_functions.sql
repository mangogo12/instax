create or replace function get_my_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profiles where user_id = auth.uid();
$$;

create or replace function get_my_restaurant_id()
returns uuid
language sql
security definer
stable
as $$
  select restaurant_id from profiles where user_id = auth.uid();
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (user_id, role, restaurant_id)
  values (
    new.id,
    (new.raw_user_meta_data->>'role')::user_role,
    (new.raw_user_meta_data->>'restaurant_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function rpc_batch_events(
  p_events jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  v_restaurant_id uuid;
  v_event jsonb;
begin
  for v_event in select * from jsonb_array_elements(p_events)
  loop
    select restaurant_id into v_restaurant_id
    from dishes
    where id = (v_event->>'dish_id')::uuid;

    if v_restaurant_id is null then
      continue;
    end if;

    if not exists (
      select 1 from restaurants
      where id = v_restaurant_id and status = 'active'
    ) then
      continue;
    end if;

    insert into events (restaurant_id, dish_id, session_id, type, duration_ms, completed)
    values (
      v_restaurant_id,
      (v_event->>'dish_id')::uuid,
      (v_event->>'session_id')::uuid,
      (v_event->>'type')::event_type,
      (v_event->>'duration_ms')::integer,
      (v_event->>'completed')::boolean
    );
  end loop;
end;
$$;

create or replace function rpc_toggle_like(
  p_dish_id uuid,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_restaurant_id uuid;
  v_liked boolean;
begin
  select restaurant_id into v_restaurant_id
  from dishes where id = p_dish_id;

  if not exists (
    select 1 from restaurants
    where id = v_restaurant_id and status = 'active'
  ) then
    raise exception 'restaurant_not_active';
  end if;

  if exists (select 1 from likes where dish_id = p_dish_id and session_id = p_session_id) then
    delete from likes where dish_id = p_dish_id and session_id = p_session_id;
    v_liked := false;
  else
    insert into likes (dish_id, session_id, restaurant_id)
    values (p_dish_id, p_session_id, v_restaurant_id);
    v_liked := true;
  end if;

  return v_liked;
end;
$$;

create or replace function rpc_create_order(
  p_restaurant_id uuid,
  p_customer_name text,
  p_table_number integer,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_restaurant restaurants%rowtype;
  v_plan plans%rowtype;
  v_order_id uuid;
  v_total integer := 0;
  v_item jsonb;
  v_dish dishes%rowtype;
  v_qty integer;
begin
  select * into v_restaurant from restaurants where id = p_restaurant_id;

  if v_restaurant.status != 'active' then
    raise exception 'restaurant_not_active';
  end if;

  select * into v_plan from plans where id = v_restaurant.plan_id;
  if not v_plan.has_orders then
    raise exception 'plan_no_orders';
  end if;

  if p_table_number < 1 or p_table_number > v_restaurant.tables_count then
    raise exception 'invalid_table';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_dish from dishes
    where id = (v_item->>'dish_id')::uuid
      and restaurant_id = p_restaurant_id
      and is_available = true;

    if not found then
      raise exception 'dish_not_found_or_unavailable';
    end if;

    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 then
      raise exception 'invalid_quantity';
    end if;

    v_total := v_total + (v_dish.price_cents * v_qty);
  end loop;

  insert into orders (restaurant_id, customer_name, table_number, total_cents)
  values (p_restaurant_id, p_customer_name, p_table_number, v_total)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_dish from dishes
    where id = (v_item->>'dish_id')::uuid;

    insert into order_items (order_id, dish_id, name_snapshot, unit_price_cents, quantity)
    values (
      v_order_id,
      v_dish.id,
      v_dish.name,
      v_dish.price_cents,
      (v_item->>'quantity')::integer
    );
  end loop;

  return v_order_id;
end;
$$;

create or replace function rpc_call_waiter(
  p_restaurant_id uuid,
  p_table_number integer,
  p_session_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_restaurant restaurants%rowtype;
  v_last_call timestamptz;
begin
  select * into v_restaurant from restaurants where id = p_restaurant_id;

  if v_restaurant.status != 'active' then
    raise exception 'restaurant_not_active';
  end if;

  select max(created_at) into v_last_call
  from waiter_calls
  where restaurant_id = p_restaurant_id
    and (session_id = p_session_id or table_number = p_table_number)
    and created_at > now() - interval '60 seconds';

  if v_last_call is not null then
    raise exception 'rate_limited';
  end if;

  insert into waiter_calls (restaurant_id, table_number, session_id)
  values (p_restaurant_id, p_table_number, p_session_id);
end;
$$;
