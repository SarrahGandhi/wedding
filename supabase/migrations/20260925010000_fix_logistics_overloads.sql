-- The optional travel-number arguments overlap the nine-argument pickup save.
-- Use exact signatures for the eight-, nine-, and eleven-argument APIs.
-- PostgreSQL requires recreating a function to remove argument defaults.
drop function public.save_family_logistics(integer, text, text, date, integer, text, text, text, text, text, text);

create function public.save_family_logistics(
    p_family_id integer,
    p_travel_mode text,
    p_travel_details text,
    p_arrival_date date,
    p_accommodation_id integer,
    p_new_kind text,
    p_new_name text,
    p_new_room_number text,
    p_train_number text,
    p_coach_number text,
    p_flight_number text
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

        insert into public.accommodations (kind, name, room_number)
        values (p_new_kind, stay_name, room)
        on conflict (kind, lower(btrim(name)), lower(btrim(coalesce(room_number, ''))))
        do update set name = accommodations.name
        returning id into stay_id;
    end if;

    insert into public.family_logistics (family_id, travel_mode, travel_details, arrival_date, accommodation_id, train_number, coach_number, flight_number)
    values (p_family_id, nullif(p_travel_mode, ''), nullif(btrim(p_travel_details), ''), p_arrival_date, stay_id,
        case when p_travel_mode = 'TRAIN' then nullif(btrim(p_train_number), '') end,
        case when p_travel_mode = 'TRAIN' then nullif(btrim(p_coach_number), '') end,
        case when p_travel_mode = 'FLIGHT' then nullif(btrim(p_flight_number), '') end)
    on conflict (family_id) do update set
        travel_mode = excluded.travel_mode,
        travel_details = excluded.travel_details,
        arrival_date = excluded.arrival_date,
        accommodation_id = excluded.accommodation_id,
        train_number = excluded.train_number,
        coach_number = excluded.coach_number,
        flight_number = excluded.flight_number;
end;
$$;

revoke all on function public.save_family_logistics(integer, text, text, date, integer, text, text, text, text, text, text) from public, anon;
grant execute on function public.save_family_logistics(integer, text, text, date, integer, text, text, text, text, text, text) to authenticated;

-- Restore the original entry point, also used by the pickup overload.
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
begin
    perform public.save_family_logistics(
        p_family_id, p_travel_mode, p_travel_details, p_arrival_date,
        p_accommodation_id, p_new_kind, p_new_name, p_new_room_number,
        null::text, null::text, null::text
    );
end;
$$;

revoke all on function public.save_family_logistics(integer, text, text, date, integer, text, text, text) from public, anon;
grant execute on function public.save_family_logistics(integer, text, text, date, integer, text, text, text) to authenticated;

notify pgrst, 'reload schema';
