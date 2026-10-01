-- Uses the existing invite-only admin access model.
create table public.wedding_flow_entries (
  id integer generated always as identity primary key,
  event_id integer not null references public.events(id) on delete cascade,
  side text not null check (side in ('BRIDE', 'GROOM', 'BOTH')),
  category text not null check (category in ('Timeline', 'Clothes', 'Shoes', 'Jewellery', 'Required items', 'Menu')),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  time time,
  owner text check (owner is null or char_length(btrim(owner)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 4000),
  completed boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now()
);
create index wedding_flow_event_idx on public.wedding_flow_entries(event_id);
alter table public.wedding_flow_entries enable row level security;
revoke all on table public.wedding_flow_entries from anon;
grant select, insert, update, delete on table public.wedding_flow_entries to authenticated, service_role;
grant usage, select on sequence public.wedding_flow_entries_id_seq to authenticated, service_role;
create policy "Admins can manage wedding flow" on public.wedding_flow_entries
  for all to authenticated using (true) with check (true);
create function public.bump_wedding_flow_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
create trigger wedding_flow_revision before update on public.wedding_flow_entries
  for each row execute function public.bump_wedding_flow_revision();
