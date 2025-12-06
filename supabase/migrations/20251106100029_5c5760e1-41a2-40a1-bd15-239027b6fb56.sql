-- Fix search_path for update_updated_at_column function
create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix search_path for generate_customer_code function
create or replace function public.generate_customer_code()
returns text 
language plpgsql
security definer
set search_path = public
as $$
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
$$;