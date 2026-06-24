create type "guest_category" as enum ('MALE', 'FEMALE', 'CHILD');
create type "guest_side" as enum ('BRIDE', 'GROOM');
create type "event_rsvp_status" as enum ('PENDING', 'ACCEPTED', 'DECLINED');

create table "guest_families" (
    id integer primary key generated always as identity,
    email text[] not null,
    phone text,
    side guest_side not null,
    created_at timestamptz not null default now()
);

create table "guests" (
    id integer primary key generated always as identity,
    name text not null,
    category guest_category not null,
    family_id integer references "guest_families"(id) on delete set null,
    created_at timestamptz not null default now()
);

create table "events" (
    id integer primary key generated always as identity,
    name text not null,
    date timestamp without time zone not null,
    location text,
    dress_code text,
    details text,
    created_at timestamptz not null default now()
);

create table "event_guests_rsvp" (
    id integer primary key generated always as identity,
    event_id integer references "events"(id) on delete cascade not null,
    guest_id integer references "guests"(id) on delete cascade not null,
    rsvp_status event_rsvp_status not null default 'PENDING',
    created_at timestamptz not null default now(),
    unique (event_id, guest_id)
);

-- Enable RLS on all application tables.
alter table "guest_families" enable row level security;
alter table "guests" enable row level security;
alter table "events" enable row level security;
alter table "event_guests_rsvp" enable row level security;

-- Anonymous users can read all tables.
create policy "Anon can view guest families"
    on "guest_families"
    for select
    to anon
    using (true);

create policy "Anon can update guest family email"
    on "guest_families"
    for update
    to anon
    using (true)
    with check (true);

create policy "Anon can view guests"
    on "guests"
    for select
    to anon
    using (true);

create policy "Anon can view events"
    on "events"
    for select
    to anon
    using (true);

create policy "Anon can view event guest RSVP"
    on "event_guests_rsvp"
    for select
    to anon
    using (true);

-- Anonymous users can update RSVP rows, but only the rsvp_status
-- column is writable through SQL privileges below.
create policy "Anon can update event guest RSVP"
    on "event_guests_rsvp"
    for update
    to anon
    using (true)
    with check (true);

-- Authenticated users can read all tables.
create policy "Authenticated can view guest families"
    on "guest_families"
    for select
    to authenticated
    using (true);

create policy "Authenticated can view guests"
    on "guests"
    for select
    to authenticated
    using (true);

create policy "Authenticated can view events"
    on "events"
    for select
    to authenticated
    using (true);

create policy "Authenticated can view event guest RSVP"
    on "event_guests_rsvp"
    for select
    to authenticated
    using (true);

-- Authenticated users have full CRUD access on all tables.
create policy "Authenticated can insert guest families"
    on "guest_families"
    for insert
    to authenticated
    with check (true);

create policy "Authenticated can update guest families"
    on "guest_families"
    for update
    to authenticated
    using (true)
    with check (true);

create policy "Authenticated can delete guest families"
    on "guest_families"
    for delete
    to authenticated
    using (true);

create policy "Authenticated can insert guests"
    on "guests"
    for insert
    to authenticated
    with check (true);

create policy "Authenticated can update guests"
    on "guests"
    for update
    to authenticated
    using (true)
    with check (true);

create policy "Authenticated can delete guests"
    on "guests"
    for delete
    to authenticated
    using (true);

create policy "Authenticated can insert events"
    on "events"
    for insert
    to authenticated
    with check (true);

create policy "Authenticated can update events"
    on "events"
    for update
    to authenticated
    using (true)
    with check (true);

create policy "Authenticated can delete events"
    on "events"
    for delete
    to authenticated
    using (true);

create policy "Authenticated can insert event guest RSVP"
    on "event_guests_rsvp"
    for insert
    to authenticated
    with check (true);

create policy "Authenticated can update event guest RSVP"
    on "event_guests_rsvp"
    for update
    to authenticated
    using (true)
    with check (true);

create policy "Authenticated can delete event guest RSVP"
    on "event_guests_rsvp"
    for delete
    to authenticated
    using (true);

-- Table privileges:
-- anon can read all tables and only update guest_families.email and event_guests_rsvp.rsvp_status
-- authenticated can perform full CRUD on all tables
revoke insert, update, delete on table "guest_families" from anon;
revoke insert, update, delete on table "guests" from anon;
revoke insert, update, delete on table "events" from anon;
revoke insert, update, delete on table "event_guests_rsvp" from anon;

grant select on table "guest_families" to anon;
grant update (email) on table "guest_families" to anon;
grant select on table "guests" to anon;
grant select on table "events" to anon;
grant select on table "event_guests_rsvp" to anon;
grant update (rsvp_status) on table "event_guests_rsvp" to anon;

grant select, insert, update, delete on table "guest_families" to authenticated;
grant select, insert, update, delete on table "guests" to authenticated;
grant select, insert, update, delete on table "events" to authenticated;
grant select, insert, update, delete on table "event_guests_rsvp" to authenticated;

-- Appends an email to a family's email list (skips duplicates).
-- Uses security definer so anon does not need direct UPDATE on the table
-- beyond the column-level grant already in place.
create or replace function public.append_family_email(family_row_id int, new_email text)
returns void
language plpgsql
security definer
as $$
begin
  update public.guest_families
  set email = array_append(email, new_email)
  where id = family_row_id
    and not (email @> array[new_email]);
end;
$$;

grant execute on function public.append_family_email(int, text) to anon;
grant execute on function public.append_family_email(int, text) to authenticated;