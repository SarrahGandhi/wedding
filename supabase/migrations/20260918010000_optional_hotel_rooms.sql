-- Hotels may be assigned before individual room numbers are known.
alter table public.accommodations
    drop constraint accommodations_room_required,
    add constraint accommodations_room_valid check (
        (kind = 'HOTEL' and (room_number is null or length(btrim(room_number)) between 1 and 40))
        or (kind = 'HOUSE' and room_number is null)
    );

create or replace function public.save_family_logistics(
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
