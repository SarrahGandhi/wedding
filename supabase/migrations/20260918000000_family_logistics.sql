-- A house or a hotel room is reusable by any number of families.
-- Keep logistics separate from the publicly readable invitation tables.
create table public.accommodations (
    id integer primary key generated always as identity,
    kind text not null check (kind in ('HOUSE', 'HOTEL')),
    name text not null check (length(btrim(name)) between 1 and 160),
    room_number text,
    created_at timestamptz not null default now(),
    constraint accommodations_room_required check (
        (kind = 'HOTEL' and room_number is not null and length(btrim(room_number)) between 1 and 40)
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
        if p_new_kind = 'HOTEL' and room is null then
            raise exception 'A room number is required for a hotel.';
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
