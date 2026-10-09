-- Run locally after applying migrations. All fixture records are rolled back.
begin;
do $$
declare
    family integer;
    guest integer;
    test_event integer;
    plans jsonb := '[
      {"guests":"Later guest","departure_mode":"BUS","departure_date":"2026-10-15","departure_time":"18:00","bus_location":"Main stand","dropoff_by":"Ali"},
      {"guests":"Train guest","departure_mode":"TRAIN","departure_date":"2026-10-14","departure_time":"09:30","train_number":"01234","station":"Central"},
      {"guests":"Flight guest","departure_mode":"FLIGHT","departure_date":"2026-10-14","departure_time":"06:00","flight_number":"AI 101","dropoff_by":"Zain"}
    ]'::jsonb;
begin
    assert public.valid_family_departures(plans), 'Valid plans rejected';
    assert not public.valid_family_departures('[{"departure_time":"24:00","departure_date":"2026-10-14"}]'), 'Invalid time accepted';
    assert not public.valid_family_departures('[{"departure_time":"08:30"}]'), 'Time without date accepted';
    assert not public.valid_family_departures('[{"departure_date":"2026-02-30"}]'), 'Invalid date accepted';
    assert not public.valid_family_departures('[{"departure_mode":"BUS","train_number":"01234"}]'), 'Wrong travel fields accepted';
    assert not public.valid_family_departures('[{"station":42}]'), 'Nontext station accepted';
    assert not public.valid_family_departures(null), 'Null plans accepted';

    insert into public.guest_families(email, side) values ('{}', 'BRIDE') returning id into family;
    insert into public.guests(name, category, family_id) values ('Departure test guest', 'FEMALE', family) returning id into guest;
    insert into public.events(name, date, time) values ('Departure test event', '2026-10-10', '12:00') returning id into test_event;
    insert into public.event_guests_rsvp(event_id, guest_id, rsvp_status) values (test_event, guest, 'ACCEPTED');
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
    execute 'set local role authenticated';
    perform public.save_family_logistics(family, 'CAR', 'Original arrival', '2026-10-09', null, 'HOUSE', 'Departure test house', null);
    perform public.save_family_departures(family, plans);
    assert (select departures = plans and departure_mode = 'FLIGHT' and departure_date = '2026-10-14'
        and dropoff_by = 'Zain' and travel_mode = 'CAR' and travel_details = 'Original arrival' and accommodation_id is not null
        from public.family_logistics where family_id = family), 'Save or earliest summary failed, or arrival changed';
    begin
        perform public.save_family_departures(family, '[{"departure_mode":"BOAT"}]');
        raise exception 'Invalid save unexpectedly succeeded';
    exception when check_violation then null;
    end;
    assert (select departures = plans from public.family_logistics where family_id = family), 'Failed save changed plans';
    perform public.save_family_departures(family, '[]');
    assert (select departures = '[]'::jsonb and departure_date is null and departure_mode is null and dropoff_by is null
        and travel_mode = 'CAR' and accommodation_id is not null from public.family_logistics where family_id = family), 'Clear failed or changed arrivals';
end;
$$;
rollback;
