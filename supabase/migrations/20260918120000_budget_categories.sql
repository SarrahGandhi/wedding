-- All money is stored as whole paise. Access follows the invite-only admin
-- model used by the rest of the application; public visitors have no access.
create type public.budget_split_type as enum ('GROOM', 'BRIDE', 'EQUAL', 'CUSTOM');

create table public.budget_categories (
  id integer generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  vendor text check (vendor is null or char_length(btrim(vendor)) between 1 and 160),
  notes text check (notes is null or char_length(notes) <= 2000),
  split_type public.budget_split_type not null default 'EQUAL',
  total_paise bigint not null check (total_paise between 0 and 99999999999),
  bride_share_paise bigint not null check (bride_share_paise between 0 and 99999999999),
  groom_share_paise bigint not null check (groom_share_paise between 0 and 99999999999),
  bride_paid_paise bigint not null default 0 check (bride_paid_paise between 0 and 99999999999),
  groom_paid_paise bigint not null default 0 check (groom_paid_paise between 0 and 99999999999),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  constraint budget_shares_equal_total check (bride_share_paise + groom_share_paise = total_paise),
  constraint budget_shares_match_split check (
    (split_type = 'GROOM' and bride_share_paise = 0) or
    (split_type = 'BRIDE' and groom_share_paise = 0) or
    (split_type = 'EQUAL' and bride_share_paise = total_paise / 2) or
    split_type = 'CUSTOM'
  )
);

alter table public.budget_categories enable row level security;
revoke all on table public.budget_categories from anon;
grant select, insert, update, delete on table public.budget_categories to authenticated, service_role;
grant usage, select on sequence public.budget_categories_id_seq to authenticated, service_role;

create policy "Admins can manage budgeting"
  on public.budget_categories for all to authenticated
  using (true) with check (true);

-- Detect stale forms so two admins cannot silently overwrite each other's payments.
create function public.bump_budget_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

create trigger budget_category_revision
before update on public.budget_categories
for each row execute function public.bump_budget_revision();
