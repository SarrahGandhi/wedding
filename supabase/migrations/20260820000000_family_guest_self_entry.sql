-- Optional family-managed guest entry.
--
-- Admins can give a family a fixed number of male/female spots, or allow the
-- family to add any number of guests. Public users never receive INSERT access
-- to guests directly: the SECURITY DEFINER function below validates and locks
-- the family row before adding names, so concurrent submissions cannot exceed
-- a fixed allowance.

alter table public.guest_families
    add column family_name text,
    add column male_guest_slots integer not null default 0,
    add column female_guest_slots integer not null default 0,
    add column allow_all_guests boolean not null default false,
    add constraint guest_families_male_guest_slots_nonnegative
        check (male_guest_slots between 0 and 20),
    add constraint guest_families_female_guest_slots_nonnegative
        check (female_guest_slots between 0 and 20),
    add constraint guest_families_fixed_guest_slots_limit
        check (male_guest_slots + female_guest_slots <= 20),
    add constraint guest_families_self_entry_requires_name
        check (
            (male_guest_slots = 0 and female_guest_slots = 0 and not allow_all_guests)
            or nullif(btrim(family_name), '') is not null
        );

alter table public.guests
    add column added_by_family boolean not null default false;

-- The earlier privacy migration restricted anonymous users to a safe subset
-- of guest_families. These fields are needed to find a family and render its
-- remaining self-entry allowance; email and phone remain private.
grant select (
    family_name,
    male_guest_slots,
    female_guest_slots,
    allow_all_guests
) on public.guest_families to anon;

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

    -- A brand-new empty family has no invitation rows to copy. In that case,
    -- include all current events. Otherwise preserve the existing family's
    -- event selection exactly.
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
