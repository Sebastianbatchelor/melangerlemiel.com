-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)

-- Tour dates shown on tickets.html
create table if not exists tour_dates (
  id uuid primary key default gen_random_uuid(),
  venue text not null,
  city text not null,
  date date,
  ticket_url text,
  created_at timestamptz not null default now()
);

-- Products shown on shop.html
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'gbp',
  image_url text,
  stripe_price_id text, -- filled in once the product exists in Stripe
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders created via Stripe Checkout
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  email text,
  amount_total_cents integer,
  currency text,
  status text not null default 'pending', -- pending | paid | failed | refunded
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders (id) on delete cascade,
  product_id uuid references products (id),
  quantity integer not null default 1,
  unit_price_cents integer not null
);

-- Row Level Security: public read on tour_dates/products, no public write.
alter table tour_dates enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public can read tour dates" on tour_dates
  for select using (true);

create policy "Public can read active products" on products
  for select using (active = true);

-- Seed the two shows from the Figma so tickets.html isn't empty on first deploy
insert into tour_dates (venue, city) values
  ('Venue M.O.T', 'London'),
  ('Lost Village Festival', 'Norton Disney');
