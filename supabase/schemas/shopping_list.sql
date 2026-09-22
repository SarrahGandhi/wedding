-- Shopping list access follows the application's invite-only admin authentication model.
create type public.shopping_urgency as enum ('LOW', 'MEDIUM', 'HIGH');

create table public.shopping_list_items (
  id integer generated always as identity primary key,
  item text not null check (char_length(btrim(item)) between 1 and 200),
  store text not null check (char_length(btrim(store)) between 1 and 160),
  vendor text not null check (char_length(btrim(vendor)) between 1 and 160),
  urgency public.shopping_urgency not null default 'MEDIUM',
  purchased boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.shopping_list_items enable row level security;
revoke all on table public.shopping_list_items from anon;
grant select, insert, update, delete on table public.shopping_list_items to authenticated, service_role;
grant usage, select on sequence public.shopping_list_items_id_seq to authenticated, service_role;

create policy "Admins can manage shopping list"
  on public.shopping_list_items for all to authenticated
  using (true) with check (true);

create function public.bump_shopping_list_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

create trigger shopping_list_revision
before update on public.shopping_list_items
for each row execute function public.bump_shopping_list_revision();
