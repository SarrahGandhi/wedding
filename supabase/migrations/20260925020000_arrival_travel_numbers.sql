-- Store train, coach, and flight numbers on each arrival, with the earliest
-- arrival mirrored into the legacy summary used by the logistics export.
create or replace function public.valid_family_arrivals(plans jsonb)
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
        foreach field in array array['guests', 'arrival_date', 'arrival_time', 'travel_mode', 'travel_details', 'pickup_by', 'train_number', 'coach_number', 'flight_number'] loop
            if entry ? field and jsonb_typeof(entry -> field) not in ('string', 'null') then return false; end if;
        end loop;
        foreach field in array array['train_number', 'coach_number', 'flight_number'] loop
            if entry ->> field is not null and length(btrim(entry ->> field)) not between 1 and 40 then return false; end if;
        end loop;
        if (entry ->> 'travel_mode') is distinct from 'TRAIN'
            and (entry ->> 'train_number' is not null or entry ->> 'coach_number' is not null) then return false; end if;
        if (entry ->> 'travel_mode') is distinct from 'FLIGHT'
            and entry ->> 'flight_number' is not null then return false; end if;
        if length(entry ->> 'guests') > 300 or length(entry ->> 'travel_details') > 1000
            or length(entry ->> 'pickup_by') > 160 then return false; end if;
        if entry ->> 'travel_mode' is not null and entry ->> 'travel_mode' not in ('FLIGHT', 'TRAIN', 'CAR', 'BUS', 'OTHER') then return false; end if;
        if entry ->> 'arrival_time' is not null then
            if entry ->> 'arrival_time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
                or entry ->> 'arrival_date' is null then return false; end if;
        end if;
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

create or replace function public.save_family_arrivals(
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
        order by value ->> 'arrival_date' nulls last, coalesce(value ->> 'arrival_time', '99:99'), ordinality limit 1;
    -- Reuse the authenticated, confirmed-family check and atomic stay assignment.
    -- The legacy summary reflects the earliest arrival for older readers.
    perform public.save_family_logistics(p_family_id, first_arrival ->> 'travel_mode',
        first_arrival ->> 'travel_details', (first_arrival ->> 'arrival_date')::date,
        p_accommodation_id, p_new_kind, p_new_name, p_new_room_number,
        first_arrival ->> 'train_number', first_arrival ->> 'coach_number', first_arrival ->> 'flight_number');
    update public.family_logistics
    set arrivals = p_arrivals, pickup_by = nullif(btrim(first_arrival ->> 'pickup_by'), '')
    where family_id = p_family_id;
end;
$$;

notify pgrst, 'reload schema';
