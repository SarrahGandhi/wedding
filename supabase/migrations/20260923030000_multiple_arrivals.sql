-- Null retains the existing single-arrival plan until it is first edited.
create function public.valid_family_arrivals(plans jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
    entry jsonb;
    field text;
    arrival text;
begin
    if jsonb_typeof(plans) is distinct from 'array' then return false; end if;
    if jsonb_array_length(plans) > 50 then return false; end if;
    for entry in select value from jsonb_array_elements(plans) loop
        if jsonb_typeof(entry) is distinct from 'object' then return false; end if;
        foreach field in array array['guests', 'arrival_date', 'travel_mode', 'travel_details', 'pickup_by'] loop
            if entry ? field and jsonb_typeof(entry -> field) not in ('string', 'null') then return false; end if;
        end loop;
        if length(entry ->> 'guests') > 300 or length(entry ->> 'travel_details') > 1000
            or length(entry ->> 'pickup_by') > 160 then return false; end if;
        if entry ->> 'travel_mode' is not null and entry ->> 'travel_mode' not in ('FLIGHT', 'TRAIN', 'CAR', 'BUS', 'OTHER') then return false; end if;
        arrival := entry ->> 'arrival_date';
        if arrival is not null then
            if arrival !~ '^\d{4}-\d{2}-\d{2}$' or arrival < '0001-01-01'
                or to_char(arrival::date, 'YYYY-MM-DD') <> arrival then return false; end if;
        end if;
    end loop;
    return true;
exception when others then return false;
end;
$$;

alter table public.family_logistics add column arrivals jsonb
    check (arrivals is null or public.valid_family_arrivals(arrivals));

create function public.save_family_arrivals(
    p_family_id integer,
    p_arrivals jsonb,
    p_accommodation_id integer,
    p_new_kind text,
    p_new_name text,
    p_new_room_number text
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
    first_arrival jsonb;
begin
    if not public.valid_family_arrivals(p_arrivals) then
        raise exception 'Enter valid pickup entries.' using errcode = '23514';
    end if;
    select value into first_arrival from jsonb_array_elements(p_arrivals) with ordinality
        order by value ->> 'arrival_date' nulls last, ordinality limit 1;
    -- Reuse the authenticated, confirmed-family check and atomic stay assignment.
    -- The legacy summary reflects the earliest arrival for older readers.
    perform public.save_family_logistics(p_family_id, first_arrival ->> 'travel_mode',
        first_arrival ->> 'travel_details', (first_arrival ->> 'arrival_date')::date,
        p_accommodation_id, p_new_kind, p_new_name, p_new_room_number, first_arrival ->> 'pickup_by');
    update public.family_logistics set arrivals = p_arrivals where family_id = p_family_id;
end;
$$;

revoke all on function public.save_family_arrivals(integer, jsonb, integer, text, text, text) from public, anon;
grant execute on function public.save_family_arrivals(integer, jsonb, integer, text, text, text) to authenticated;
