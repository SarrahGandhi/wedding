alter table public.family_logistics
    add column pickup_by text
        check (pickup_by is null or length(btrim(pickup_by)) between 1 and 160);

-- Keep the existing eight-argument save for older clients. The new overload
-- saves pickup details in the same transaction as travel and accommodation.
create function public.save_family_logistics(
    p_family_id integer,
    p_travel_mode text,
    p_travel_details text,
    p_arrival_date date,
    p_accommodation_id integer,
    p_new_kind text,
    p_new_name text,
    p_new_room_number text,
    p_pickup_by text
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
    perform public.save_family_logistics(
        p_family_id, p_travel_mode, p_travel_details, p_arrival_date,
        p_accommodation_id, p_new_kind, p_new_name, p_new_room_number
    );

    update public.family_logistics
    set pickup_by = nullif(btrim(p_pickup_by), '')
    where family_id = p_family_id;
end;
$$;

revoke all on function public.save_family_logistics(integer, text, text, date, integer, text, text, text, text) from public, anon;
grant execute on function public.save_family_logistics(integer, text, text, date, integer, text, text, text, text) to authenticated;
