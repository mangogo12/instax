insert into plans (id, name, price_cents, has_orders) values
  ('00000000-0000-0000-0000-000000000001', 'Feed', 9900, false),
  ('00000000-0000-0000-0000-000000000002', 'Feed + Pedidos e Garçom', 17900, true);

insert into restaurants (id, slug, name, status, plan_id, tables_count) values
  (
    '00000000-0000-0000-0000-000000000010',
    'demo-burguer',
    'Demo Burguer',
    'active',
    '00000000-0000-0000-0000-000000000002',
    10
  );

insert into categories (id, restaurant_id, name, sort_order) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Hambúrgueres', 0),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Bebidas', 1),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'Sobremesas', 2);

insert into dishes (restaurant_id, category_id, name, description, ingredients, serves, prep_time_min, price_cents, media_type, image_url, is_available, is_featured, sort_order) values
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'Classic Smash',
    'Smash burger com queijo americano e molho especial',
    'Blend 180g, queijo americano, alface, tomate, cebola, molho especial, pão brioche',
    1, 12, 3200, 'image',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    true, true, 0
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000020',
    'Double Bacon',
    'Dois blends com bacon crocante e cheddar',
    'Blend 2x180g, bacon, cheddar, alface, tomate, molho barbecue, pão australiano',
    1, 15, 4500, 'image',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800',
    true, false, 1
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000021',
    'Refrigerante Lata',
    'Coca-Cola, Guaraná ou Sprite 350ml',
    null,
    1, 1, 700, 'image',
    'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800',
    true, false, 0
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000021',
    'Milk Shake',
    'Batido cremoso em 3 sabores: chocolate, morango ou baunilha',
    'Sorvete, leite, calda',
    1, 5, 1800, 'image',
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
    true, false, 1
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000022',
    'Brownie com Sorvete',
    'Brownie quente com sorvete de baunilha e calda de chocolate',
    'Brownie de chocolate, sorvete, calda',
    2, 8, 2200, 'image',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
    true, false, 0
  );
