create type "guest_category" as enum ('MALE', 'FEMALE', 'CHILD');
create type "guest_side" as enum ('BRIDE', 'GROOM');
create type "event_rsvp_status" as enum ('PENDING', 'ACCEPTED', 'DECLINED');

create table "guest_families" (
    id integer primary key generated always as identity,
    email text[] not null,
    phone text,
    side guest_side not null,
    family_name text,
    male_guest_slots integer not null default 0 check (male_guest_slots between 0 and 20),
    female_guest_slots integer not null default 0 check (female_guest_slots between 0 and 20),
    allow_all_guests boolean not null default false,
    created_at timestamptz not null default now(),
    constraint guest_families_self_entry_requires_name check (
        (male_guest_slots = 0 and female_guest_slots = 0 and not allow_all_guests)
        or nullif(btrim(family_name), '') is not null
    ),
    constraint guest_families_fixed_guest_slots_limit check (
        male_guest_slots + female_guest_slots <= 20
    )
);

create table "guests" (
    id integer primary key generated always as identity,
    name text not null,
    category guest_category not null,
    added_by_family boolean not null default false,
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

grant select (id, side, created_at, family_name, male_guest_slots, female_guest_slots, allow_all_guests)
    on table "guest_families" to anon;
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

-- Adds family-entered guest names while enforcing the admin's optional limits.
create or replace function public.add_family_guests(
    family_row_id integer,
    guest_names text[],
    guest_categories public.guest_category[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    family_row public.guest_families%rowtype;
    requested_count integer := coalesce(cardinality(guest_names), 0);
    requested_male integer := 0;
    requested_female integer := 0;
    used_male integer := 0;
    used_female integer := 0;
    existing_guest_count integer := 0;
    normalized_names text[] := array[]::text[];
    inserted_guest_ids integer[] := array[]::integer[];
    template_event_ids integer[] := array[]::integer[];
    current_name text;
    current_category public.guest_category;
    new_guest_id integer;
    i integer;
begin
    if requested_count = 0 or requested_count > 20 then
        raise exception 'Add between 1 and 20 guests at a time.';
    end if;

    if requested_count is distinct from coalesce(cardinality(guest_categories), 0) then
        raise exception 'Every guest needs a category.';
    end if;

    select *
    into family_row
    from public.guest_families
    where id = family_row_id
    for update;

    if not found then
        raise exception 'This invitation could not be found.';
    end if;

    for i in 1..requested_count loop
        current_name := btrim(guest_names[i]);
        current_category := guest_categories[i];

        if current_name is null or current_name = '' or char_length(current_name) > 100 then
            raise exception 'Each guest needs a name between 1 and 100 characters.';
        end if;

        if lower(current_name) = any(normalized_names) then
            raise exception 'Each guest name can only be added once.';
        end if;

        if exists (
            select 1
            from public.guests
            where family_id = family_row_id
              and lower(name) = lower(current_name)
        ) then
            raise exception 'A guest named "%" is already on this invitation.', current_name;
        end if;

        normalized_names := array_append(normalized_names, lower(current_name));
        requested_male := requested_male + case when current_category = 'MALE' then 1 else 0 end;
        requested_female := requested_female + case when current_category = 'FEMALE' then 1 else 0 end;

        if not family_row.allow_all_guests and current_category = 'CHILD' then
            raise exception 'This invitation does not include child guest spots.';
        end if;
    end loop;

    if not family_row.allow_all_guests then
        select
            count(*) filter (where category = 'MALE'),
            count(*) filter (where category = 'FEMALE')
        into used_male, used_female
        from public.guests
        where family_id = family_row_id
          and added_by_family;

        if used_male + requested_male > family_row.male_guest_slots then
            raise exception 'There are not enough male guest spots remaining.';
        end if;

        if used_female + requested_female > family_row.female_guest_slots then
            raise exception 'There are not enough female guest spots remaining.';
        end if;
    end if;

    select count(*)
    into existing_guest_count
    from public.guests
    where family_id = family_row_id;

    select coalesce(array_agg(distinct r.event_id), array[]::integer[])
    into template_event_ids
    from public.event_guests_rsvp r
    join public.guests g on g.id = r.guest_id
    where g.family_id = family_row_id;

    if existing_guest_count = 0 and cardinality(template_event_ids) = 0 then
        select coalesce(array_agg(id order by id), array[]::integer[])
        into template_event_ids
        from public.events;
    end if;

    for i in 1..requested_count loop
        insert into public.guests (name, category, family_id, added_by_family)
        values (btrim(guest_names[i]), guest_categories[i], family_row_id, true)
        returning id into new_guest_id;

        inserted_guest_ids := array_append(inserted_guest_ids, new_guest_id);
    end loop;

    if cardinality(template_event_ids) > 0 then
        insert into public.event_guests_rsvp (event_id, guest_id, rsvp_status)
        select event_id, guest_id, 'PENDING'::public.event_rsvp_status
        from unnest(template_event_ids) event_id
        cross join unnest(inserted_guest_ids) guest_id
        on conflict (event_id, guest_id) do nothing;
    end if;

    return requested_count;
end;
$$;

revoke all on function public.add_family_guests(integer, text[], public.guest_category[]) from public;
grant execute on function public.add_family_guests(integer, text[], public.guest_category[]) to anon;
grant execute on function public.add_family_guests(integer, text[], public.guest_category[]) to authenticated;

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
