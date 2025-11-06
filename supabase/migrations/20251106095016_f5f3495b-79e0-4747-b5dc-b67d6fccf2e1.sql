-- Create role enum
create type public.app_role as enum ('admin', 'customer');

-- Create customer type enum  
create type public.customer_type as enum ('prepaid', 'credit');

-- Create customer status enum
create type public.customer_status as enum ('active', 'frozen');

-- Create payment method enum
create type public.payment_method as enum ('bank_transfer', 'credit_card', 'paypal', 'other');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create customers table
create table public.customers (
    id uuid primary key default gen_random_uuid(),
    customer_code text unique not null,
    company_name text not null,
    company_address text,
    customer_type customer_type not null default 'prepaid',
    status customer_status not null default 'active',
    credit_limit decimal(10,2) default 0,
    payment_terms integer default 0, -- days
    payment_due_date date,
    commission_type text, -- 'percentage' or 'fixed'
    commission_value decimal(10,2) default 0,
    balance decimal(10,2) default 0,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

alter table public.customers enable row level security;

-- Create customer_users table (links users to customers)
create table public.customer_users (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    customer_id uuid references public.customers(id) on delete cascade not null,
    unique (user_id, customer_id)
);

alter table public.customer_users enable row level security;

-- Create payment vouchers table
create table public.payment_vouchers (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references public.customers(id) on delete cascade not null,
    payment_method payment_method not null,
    amount decimal(10,2) not null,
    voucher_url text not null,
    status text not null default 'pending', -- pending, approved, rejected
    created_at timestamp with time zone not null default now(),
    processed_at timestamp with time zone,
    processed_by uuid references auth.users(id)
);

alter table public.payment_vouchers enable row level security;

-- Create coupons table
create table public.coupons (
    id uuid primary key default gen_random_uuid(),
    coupon_code text unique not null,
    amount decimal(10,2) not null,
    customer_id uuid references public.customers(id) on delete cascade,
    status text not null default 'active', -- active, used, void
    created_by uuid references auth.users(id) not null,
    created_at timestamp with time zone not null default now(),
    used_at timestamp with time zone,
    voided_at timestamp with time zone
);

alter table public.coupons enable row level security;

-- Create rebills table  
create table public.rebills (
    id uuid primary key default gen_random_uuid(),
    order_id text not null,
    customer_id uuid references public.customers(id) on delete cascade not null,
    original_amount decimal(10,2) not null,
    actual_amount decimal(10,2) not null,
    difference decimal(10,2) not null,
    base_fee decimal(10,2) default 0,
    fuel_surcharge decimal(10,2) default 0,
    long_haul_fee decimal(10,2) default 0,
    other_fees decimal(10,2) default 0,
    created_by uuid references auth.users(id) not null,
    created_at timestamp with time zone not null default now()
);

alter table public.rebills enable row level security;

-- Create orders table (extended)
create table public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text unique not null,
    reference_number text,
    customer_id uuid references public.customers(id) on delete cascade not null,
    customer_code text not null,
    carrier_name text,
    pro_number text,
    bol_number text,
    sku text,
    pickup_zip text not null,
    delivery_zip text not null,
    cargo_description text,
    status text not null,
    quoted_amount decimal(10,2) not null,
    actual_cost decimal(10,2),
    profit decimal(10,2),
    pallet_label_url text,
    bol_url text,
    sbol_url text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

alter table public.orders enable row level security;

-- Create platform stats table (for tracking orders by platform)
create table public.platform_orders (
    id uuid primary key default gen_random_uuid(),
    platform_name text not null,
    order_id uuid references public.orders(id) on delete cascade not null,
    order_date timestamp with time zone not null default now()
);

alter table public.platform_orders enable row level security;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for customers
create policy "Admins can view all customers"
on public.customers for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Customers can view their own customer record"
on public.customers for select
to authenticated
using (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = customers.id
  )
);

create policy "Admins can insert customers"
on public.customers for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update customers"
on public.customers for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for customer_users
create policy "Admins can view all customer users"
on public.customer_users for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can view their own customer link"
on public.customer_users for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can insert customer users"
on public.customer_users for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete customer users"
on public.customer_users for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_vouchers
create policy "Admins can view all vouchers"
on public.payment_vouchers for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Customers can view their own vouchers"
on public.payment_vouchers for select
to authenticated
using (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = payment_vouchers.customer_id
  )
);

create policy "Customers can insert their own vouchers"
on public.payment_vouchers for insert
to authenticated
with check (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = payment_vouchers.customer_id
  )
);

create policy "Admins can update vouchers"
on public.payment_vouchers for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for coupons
create policy "Admins can view all coupons"
on public.coupons for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Customers can view their own coupons"
on public.coupons for select
to authenticated
using (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = coupons.customer_id
  )
);

create policy "Admins can insert coupons"
on public.coupons for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update coupons"
on public.coupons for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rebills
create policy "Admins can view all rebills"
on public.rebills for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert rebills"
on public.rebills for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
create policy "Admins can view all orders"
on public.orders for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Customers can view their own orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = orders.customer_id
  )
);

create policy "Admins can insert orders"
on public.orders for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Customers can insert their own orders"
on public.orders for insert
to authenticated
with check (
  exists (
    select 1 from public.customer_users
    where customer_users.user_id = auth.uid()
    and customer_users.customer_id = orders.customer_id
  )
);

create policy "Admins can update orders"
on public.orders for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for platform_orders
create policy "Admins can view all platform orders"
on public.platform_orders for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert platform orders"
on public.platform_orders for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_customers_updated_at
before update on public.customers
for each row execute function public.update_updated_at_column();

create trigger update_orders_updated_at
before update on public.orders
for each row execute function public.update_updated_at_column();

-- Function to generate next customer code
create or replace function public.generate_customer_code()
returns text as $$
declare
  next_num integer;
  code_num integer;
  new_code text;
begin
  -- Get the highest existing number
  select coalesce(max(substring(customer_code from 2)::integer), 0) into next_num
  from public.customers
  where customer_code ~ '^T[0-9]+$';
  
  -- Increment and skip numbers containing 4
  loop
    next_num := next_num + 1;
    if not (next_num::text ~ '4') then
      exit;
    end if;
  end loop;
  
  -- Format as T0001, T0002, etc
  new_code := 'T' || lpad(next_num::text, 4, '0');
  return new_code;
end;
$$ language plpgsql;