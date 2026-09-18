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
    -- Restrict, not cascade: emptying a family is a deliberate step the admin
    -- takes before deleting it, never a side effect of the delete.
    family_id integer not null references "guest_families"(id) on delete restrict,
    created_at timestamptz not null default now()
);

create table "events" (
    id integer primary key generated always as identity,
    name text not null,
    date date not null,
    time time without time zone not null,
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

-- Debounce state for RSVP confirmation emails (see migration
-- 20260705000000_rsvp_email_queue.sql). One row per family: a status change
-- marks the family dirty; the dispatch-rsvp-emails edge function (run by
-- pg_cron) waits for a quiet window then sends one email with the latest state.
create table "rsvp_email_queue" (
    family_id integer primary key references "guest_families"(id) on delete cascade,
    dirty boolean not null default true,
    batch_started_at timestamptz not null default now(),
    last_change_at timestamptz not null default now(),
    last_sent_at timestamptz
);

alter table "rsvp_email_queue" enable row level security;

create or replace function public.enqueue_rsvp_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    fam_id integer;
begin
    select family_id into fam_id from public.guests where id = NEW.guest_id;
    if fam_id is null then
        return NEW;
    end if;

    insert into public.rsvp_email_queue as q
        (family_id, dirty, batch_started_at, last_change_at)
    values (fam_id, true, now(), now())
    on conflict (family_id) do update
    set last_change_at = now(),
        batch_started_at = case when q.dirty then q.batch_started_at else now() end,
        dirty = true;

    return NEW;
end;
$$;

create trigger "trg_enqueue_rsvp_email"
after update of rsvp_status on "event_guests_rsvp"
for each row
when (OLD.rsvp_status is distinct from NEW.rsvp_status)
execute function public.enqueue_rsvp_email();

-- A house or a hotel room is reusable by any number of families.
-- Keep logistics separate from the publicly readable invitation tables.
create table public.accommodations (
    id integer primary key generated always as identity,
    kind text not null check (kind in ('HOUSE', 'HOTEL')),
    name text not null check (length(btrim(name)) between 1 and 160),
    room_number text,
    created_at timestamptz not null default now(),
    constraint accommodations_room_valid check (
        (kind = 'HOTEL' and (room_number is null or length(btrim(room_number)) between 1 and 40))
        or (kind = 'HOUSE' and room_number is null)
    )
);

create unique index accommodations_unique_stay
    on public.accommodations (kind, lower(btrim(name)), lower(btrim(coalesce(room_number, ''))));

create table public.family_logistics (
    family_id integer primary key references public.guest_families(id) on delete cascade,
    travel_mode text check (travel_mode in ('FLIGHT', 'TRAIN', 'CAR', 'BUS', 'OTHER')),
    travel_details text check (length(travel_details) <= 1000),
    arrival_date date,
    accommodation_id integer references public.accommodations(id) on delete restrict
);

create index family_logistics_accommodation_idx on public.family_logistics(accommodation_id);

alter table public.accommodations enable row level security;
alter table public.family_logistics enable row level security;

revoke all on public.accommodations, public.family_logistics from anon;
revoke all on sequence public.accommodations_id_seq from anon;
grant select, insert, update, delete on public.accommodations, public.family_logistics to authenticated;
grant usage, select on sequence public.accommodations_id_seq to authenticated;

create policy "Admins manage accommodations" on public.accommodations
    for all to authenticated using (true) with check (true);

create policy "Admins read logistics" on public.family_logistics
    for select to authenticated using (true);
create policy "Admins delete logistics" on public.family_logistics
    for delete to authenticated using (true);
create policy "Admins insert confirmed family logistics" on public.family_logistics
    for insert to authenticated with check (
        exists (
            select 1 from public.guests g
            join public.event_guests_rsvp r on r.guest_id = g.id
            where g.family_id = family_logistics.family_id and r.rsvp_status = 'ACCEPTED'
        )
    );
create policy "Admins update confirmed family logistics" on public.family_logistics
    for update to authenticated using (true) with check (
        exists (
            select 1 from public.guests g
            join public.event_guests_rsvp r on r.guest_id = g.id
            where g.family_id = family_logistics.family_id and r.rsvp_status = 'ACCEPTED'
        )
    );

-- Save the stay and its assignment atomically. Concurrent submissions of the
-- same house/room reuse the unique stay instead of creating duplicates.
create function public.save_family_logistics(
    p_family_id integer,
    p_travel_mode text,
    p_travel_details text,
    p_arrival_date date,
    p_accommodation_id integer,
    p_new_kind text,
    p_new_name text,
    p_new_room_number text
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    stay_id integer := p_accommodation_id;
    stay_name text := nullif(btrim(p_new_name), '');
    room text := nullif(btrim(p_new_room_number), '');
begin
    if auth.uid() is null then
        raise exception 'Sign in to manage logistics.';
    end if;

    if not exists (
        select 1 from public.guests g
        join public.event_guests_rsvp r on r.guest_id = g.id
        where g.family_id = p_family_id and r.rsvp_status = 'ACCEPTED'
    ) then
        raise exception 'This family no longer has any confirmed guests. Refresh the page to continue.';
    end if;

    if p_new_kind is not null then
        if stay_id is not null then
            raise exception 'Choose an existing accommodation or add a new one.';
        end if;
        if p_new_kind not in ('HOUSE', 'HOTEL') or stay_name is null then
            raise exception 'Enter a house or hotel name.';
        end if;
        if p_new_kind = 'HOUSE' then
            room := null;
        end if;

        insert into public.accommodations (kind, name, room_number)
        values (p_new_kind, stay_name, room)
        on conflict (kind, lower(btrim(name)), lower(btrim(coalesce(room_number, ''))))
        do update set name = accommodations.name
        returning id into stay_id;
    end if;

    insert into public.family_logistics (family_id, travel_mode, travel_details, arrival_date, accommodation_id)
    values (p_family_id, nullif(p_travel_mode, ''), nullif(btrim(p_travel_details), ''), p_arrival_date, stay_id)
    on conflict (family_id) do update set
        travel_mode = excluded.travel_mode,
        travel_details = excluded.travel_details,
        arrival_date = excluded.arrival_date,
        accommodation_id = excluded.accommodation_id;
end;
$$;

revoke all on function public.save_family_logistics(integer, text, text, date, integer, text, text, text) from public, anon;
grant execute on function public.save_family_logistics(integer, text, text, date, integer, text, text, text) to authenticated;
