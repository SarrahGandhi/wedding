-- Guest IDs key room assignments so duplicate names remain independent.
alter table public.family_logistics add column guest_rooms jsonb not null default '{}'::jsonb
    check (jsonb_typeof(guest_rooms) = 'object');

create function public.save_family_guest_rooms(
    p_family_id integer, p_arrivals jsonb, p_accommodation_id integer,
    p_new_kind text, p_new_name text, p_new_room_number text, p_guest_rooms jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
    guest_key text;
    room jsonb;
    normalized jsonb := '{}'::jsonb;
begin
    if jsonb_typeof(p_guest_rooms) is distinct from 'object' then
        raise exception 'Enter valid guest rooms.' using errcode = '23514';
    end if;
    for guest_key, room in select key, value from jsonb_each(p_guest_rooms) loop
        if guest_key !~ '^[1-9][0-9]*$' or jsonb_typeof(room) not in ('string', 'null') then
            raise exception 'Enter valid guest rooms.' using errcode = '23514';
        end if;
        if not exists (
            select 1 from public.guests g
            where g.id::text = guest_key and g.family_id = p_family_id
            and exists (select 1 from public.event_guests_rsvp r where r.guest_id = g.id and r.rsvp_status = 'ACCEPTED')
        ) then
            raise exception 'A guest is no longer confirmed for this family. Refresh the page and try again.';
        end if;
        if length(btrim(room #>> '{}')) > 40 then
            raise exception 'Enter room numbers of up to 40 characters.' using errcode = '23514';
        end if;
        normalized := normalized || jsonb_build_object(guest_key, nullif(btrim(room #>> '{}'), ''));
    end loop;
    -- Reuse existing authorization and save everything in one transaction.
    perform public.save_family_arrivals(p_family_id, p_arrivals, p_accommodation_id,
        p_new_kind, p_new_name, p_new_room_number);
    update public.family_logistics set guest_rooms = normalized where family_id = p_family_id;
end;
$$;
revoke all on function public.save_family_guest_rooms(integer, jsonb, integer, text, text, text, jsonb) from public, anon;
grant execute on function public.save_family_guest_rooms(integer, jsonb, integer, text, text, text, jsonb) to authenticated;
notify pgrst, 'reload schema';
