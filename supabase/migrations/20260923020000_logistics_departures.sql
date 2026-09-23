alter table public.family_logistics
    add column departure_mode text check (departure_mode in ('FLIGHT', 'TRAIN', 'CAR', 'BUS', 'OTHER')),
    add column departure_date date,
    add column departure_details text check (length(departure_details) <= 1000),
    add column dropoff_by text check (dropoff_by is null or length(btrim(dropoff_by)) between 1 and 160);

-- Only departure columns are updated, preserving independently saved arrivals.
create function public.save_family_departure(
    p_family_id integer,
    p_departure_mode text,
    p_departure_date date,
    p_departure_details text,
    p_dropoff_by text
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
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

    insert into public.family_logistics (family_id, departure_mode, departure_date, departure_details, dropoff_by)
    values (p_family_id, nullif(btrim(p_departure_mode), ''), p_departure_date,
        nullif(btrim(p_departure_details), ''), nullif(btrim(p_dropoff_by), ''))
    on conflict (family_id) do update set
        departure_mode = excluded.departure_mode,
        departure_date = excluded.departure_date,
        departure_details = excluded.departure_details,
        dropoff_by = excluded.dropoff_by;
end;
$$;

revoke all on function public.save_family_departure(integer, text, date, text, text) from public, anon;
grant execute on function public.save_family_departure(integer, text, date, text, text) to authenticated;
