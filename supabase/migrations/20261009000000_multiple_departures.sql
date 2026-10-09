-- NULL preserves legacy single departures; [] explicitly clears all departures.
create function public.valid_family_departures(plans jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
    entry jsonb;
    field text;
    departure text;
begin
    if jsonb_typeof(plans) is distinct from 'array' then return false; end if;
    if jsonb_array_length(plans) > 50 then return false; end if;
    for entry in select value from jsonb_array_elements(plans) loop
        if jsonb_typeof(entry) is distinct from 'object' then return false; end if;
        foreach field in array array['guests', 'departure_date', 'departure_time', 'departure_mode',
            'train_number', 'flight_number', 'station', 'bus_location', 'departure_details', 'dropoff_by'] loop
            if entry ? field and jsonb_typeof(entry -> field) not in ('string', 'null') then return false; end if;
        end loop;
        if length(entry ->> 'guests') > 300 or length(entry ->> 'departure_details') > 1000 then return false; end if;
        foreach field in array array['station', 'bus_location', 'dropoff_by'] loop
            if length(entry ->> field) > 160 then return false; end if;
        end loop;
        foreach field in array array['train_number', 'flight_number'] loop
            if entry ->> field is not null and length(btrim(entry ->> field)) not between 1 and 40 then return false; end if;
        end loop;
        if (entry ->> 'departure_mode') is distinct from 'TRAIN'
            and (entry ->> 'train_number' is not null or entry ->> 'station' is not null) then return false; end if;
        if (entry ->> 'departure_mode') is distinct from 'FLIGHT' and entry ->> 'flight_number' is not null then return false; end if;
        if (entry ->> 'departure_mode') is distinct from 'BUS' and entry ->> 'bus_location' is not null then return false; end if;
        if entry ->> 'departure_mode' is not null and entry ->> 'departure_mode' not in ('FLIGHT', 'TRAIN', 'CAR', 'BUS', 'OTHER') then return false; end if;
        if entry ->> 'departure_time' is not null then
            if entry ->> 'departure_time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
                or entry ->> 'departure_date' is null then return false; end if;
        end if;
        departure := entry ->> 'departure_date';
        if departure is not null then
            if departure !~ '^\d{4}-\d{2}-\d{2}$' or departure < '0001-01-01'
                or to_char(departure::date, 'YYYY-MM-DD') <> departure then return false; end if;
        end if;
    end loop;
    return true;
exception when others then return false;
end;
$$;

alter table public.family_logistics add column departures jsonb
    check (departures is null or public.valid_family_departures(departures));

create function public.save_family_departures(p_family_id integer, p_departures jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
    first_departure jsonb;
begin
    if not public.valid_family_departures(p_departures) then
        raise exception 'Enter valid departure entries.' using errcode = '23514';
    end if;
    select value into first_departure from jsonb_array_elements(p_departures) with ordinality
        order by value ->> 'departure_date' nulls last, coalesce(value ->> 'departure_time', '99:99'), ordinality limit 1;
    -- Reuse the authenticated, confirmed-family check and update only departures.
    -- Keep the earliest departure available to legacy readers.
    perform public.save_family_departure(p_family_id, first_departure ->> 'departure_mode',
        (first_departure ->> 'departure_date')::date, first_departure ->> 'departure_details',
        first_departure ->> 'dropoff_by');
    update public.family_logistics set departures = p_departures where family_id = p_family_id;
end;
$$;

revoke all on function public.save_family_departures(integer, jsonb) from public, anon;
grant execute on function public.save_family_departures(integer, jsonb) to authenticated;
notify pgrst, 'reload schema';
