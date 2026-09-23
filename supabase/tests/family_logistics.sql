-- Run against a local database after applying the migration. All test records
-- are rolled back, including RSVP queue entries created by existing triggers.
begin;
do $$
declare
    family_a integer;
    family_b integer;
    pending_family integer;
    guest_a integer;
    guest_b integer;
    test_event integer;
    shared_id integer;
    second_id integer;
    stay_count integer;
begin
    insert into public.guest_families(email, side) values ('{}', 'BRIDE') returning id into family_a;
    insert into public.guest_families(email, side) values ('{}', 'GROOM') returning id into family_b;
    insert into public.guest_families(email, side) values ('{}', 'BRIDE') returning id into pending_family;
    insert into public.guests(name, category, family_id) values ('Logistics test A', 'FEMALE', family_a) returning id into guest_a;
    insert into public.guests(name, category, family_id) values ('Logistics test B', 'MALE', family_b) returning id into guest_b;
    insert into public.events(name, date, time) values ('Logistics test event', '2026-10-10', '12:00') returning id into test_event;
    insert into public.event_guests_rsvp(event_id, guest_id, rsvp_status)
        values (test_event, guest_a, 'ACCEPTED'), (test_event, guest_b, 'ACCEPTED');

    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
    execute 'set local role authenticated';

    -- A departure can be planned before any arrival details exist.
    perform public.save_family_departure(family_b, 'TRAIN', '2026-10-14', 'Evening train', ' Zain ');
    assert (select departure_mode = 'TRAIN' and departure_date = '2026-10-14' and dropoff_by = 'Zain'
        and travel_mode is null and accommodation_id is null from public.family_logistics where family_id = family_b),
        'Departure-only save failed';

    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', null, 'HOTEL', 'Logistics test hotel', '10');
    select accommodation_id into shared_id from public.family_logistics where family_id = family_a;
    perform public.save_family_logistics(family_b, 'TRAIN', null, '2026-10-10', shared_id, null, null, null);
    if (select count(*) from public.family_logistics where accommodation_id = shared_id) <> 2 then
        raise exception 'Shared hotel room assignment failed';
    end if;
    assert (select departure_mode = 'TRAIN' and dropoff_by = 'Zain'
        from public.family_logistics where family_id = family_b), 'Arrival save changed departure details';
    perform public.save_family_departure(family_b, 'FLIGHT', '2026-10-15', 'Morning flight', 'Ali');
    assert (select departure_mode = 'FLIGHT' and dropoff_by = 'Ali' and travel_mode = 'TRAIN'
        and arrival_date = '2026-10-10' and accommodation_id = shared_id
        from public.family_logistics where family_id = family_b), 'Departure edit changed arrival details';
    perform public.save_family_departure(family_b, null, null, null, '   ');
    assert (select departure_mode is null and departure_date is null and departure_details is null and dropoff_by is null
        and travel_mode = 'TRAIN' and accommodation_id = shared_id from public.family_logistics where family_id = family_b),
        'Clearing departure details changed arrival details';
    begin
        perform public.save_family_departure(family_b, 'INVALID', null, null, null);
        raise exception 'Invalid departure mode was accepted';
    exception when check_violation then null;
    end;
    begin
        perform public.save_family_departure(family_b, 'TRAIN', null, null, repeat('a', 161));
        raise exception 'Oversized drop-off name was accepted';
    exception when check_violation then null;
    end;
    begin
        perform public.save_family_departure(pending_family, 'TRAIN', null, null, null);
        raise exception 'Unconfirmed departure was accepted';
    exception when raise_exception then
        if sqlerrm not like 'This family no longer%' then raise; end if;
    end;

    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', shared_id, null, null, null, ' Ali Khan ');
    assert (select pickup_by = 'Ali Khan' and accommodation_id = shared_id and travel_mode = 'FLIGHT'
        from public.family_logistics where family_id = family_a), 'Pickup details did not save with travel details';
    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', shared_id, null, null, null);
    assert (select pickup_by = 'Ali Khan' from public.family_logistics where family_id = family_a),
        'An older client cleared pickup details';
    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', shared_id, null, null, null, 'Zain');
    assert (select pickup_by = 'Zain' from public.family_logistics where family_id = family_a), 'Pickup name did not update';
    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', shared_id, null, null, null, '   ');
    assert (select pickup_by is null from public.family_logistics where family_id = family_a), 'Pickup name did not clear';
    select count(*) into stay_count from public.accommodations;
    begin
        perform public.save_family_logistics(family_a, 'CAR', null, null, null, 'HOUSE', 'Invalid pickup house', null, repeat('a', 161));
        raise exception 'Oversized pickup name was accepted';
    exception when check_violation then null;
    end;
    assert (select count(*) = stay_count from public.accommodations), 'Invalid pickup left an orphan accommodation';
    assert (select accommodation_id = shared_id and travel_mode = 'FLIGHT'
        from public.family_logistics where family_id = family_a), 'Invalid pickup partially saved logistics';

    perform public.save_family_logistics(family_b, null, null, null, null, 'HOTEL', ' LOGISTICS TEST HOTEL ', ' 10 ');
    if (select accommodation_id from public.family_logistics where family_id = family_b) <> shared_id then
        raise exception 'Duplicate hotel room was not reused';
    end if;

    perform public.save_family_logistics(family_b, null, null, null, null, 'HOTEL', 'Logistics other hotel', '10');
    if (select accommodation_id from public.family_logistics where family_id = family_b) = shared_id then
        raise exception 'Different hotels were merged';
    end if;

    perform public.save_family_logistics(family_a, 'CAR', null, null, null, 'HOUSE', 'Logistics test house', null);
    select accommodation_id into second_id from public.family_logistics where family_id = family_a;
    perform public.save_family_logistics(family_b, null, null, null, second_id, null, null, null);
    if (select room_number from public.accommodations where id = second_id) is not null then
        raise exception 'A house unexpectedly has a room';
    end if;
    if (select count(*) from public.family_logistics where accommodation_id = second_id) <> 2 then
        raise exception 'Shared house assignment failed';
    end if;

    perform public.save_family_logistics(family_a, null, null, null, null, 'HOTEL', 'Logistics pending room hotel', null);
    select accommodation_id into shared_id from public.family_logistics where family_id = family_a;
    if (select room_number from public.accommodations where id = shared_id) is not null then
        raise exception 'Optional hotel room was not saved as null';
    end if;
    perform public.save_family_logistics(family_b, null, null, null, null, 'HOTEL', 'Logistics pending room hotel', '   ');
    if (select accommodation_id from public.family_logistics where family_id = family_b) <> shared_id then
        raise exception 'Hotel with an unknown room was not reused';
    end if;
    perform public.save_family_logistics(family_a, null, null, null, null, 'HOTEL', 'Logistics pending room hotel', '201');
    if (select accommodation_id from public.family_logistics where family_id = family_a) = shared_id then
        raise exception 'Assigning a room changed the hotel-only accommodation';
    end if;
    if (select accommodation_id from public.family_logistics where family_id = family_b) <> shared_id then
        raise exception 'Assigning a room changed another family';
    end if;
    begin
        insert into public.accommodations(kind, name, room_number) values ('HOTEL', 'Invalid direct insert', '   ');
        raise exception 'Hotel constraint was bypassed';
    exception when check_violation then null;
    end;
    begin
        perform public.save_family_logistics(pending_family, null, null, null, null, 'HOUSE', 'Unconfirmed house', null);
        raise exception 'Unconfirmed family was accepted';
    exception when raise_exception then
        if sqlerrm not like 'This family no longer%' then raise; end if;
    end;
    begin
        insert into public.family_logistics(family_id) values (pending_family);
        raise exception 'Confirmed-family policy was bypassed';
    exception when insufficient_privilege then null;
    end;

    select count(*) into stay_count from public.accommodations;
    begin
        perform public.save_family_logistics(family_a, 'INVALID', null, null, null, 'HOUSE', 'Rolled back house', null);
        raise exception 'Invalid travel mode was accepted';
    exception when check_violation then null;
    end;
    if (select count(*) from public.accommodations) <> stay_count then
        raise exception 'Failed save left an orphan accommodation';
    end if;

    perform public.save_family_logistics(family_a, null, null, null, null, null, null, null);
    if (select accommodation_id from public.family_logistics where family_id = family_a) is not null then
        raise exception 'Accommodation was not cleared';
    end if;

    perform public.save_family_departure(family_a, 'TRAIN', '2026-10-15', 'Departure kept', 'Zain');
    perform public.save_family_arrivals(family_a, '[
        {"guests":"Remaining family","arrival_date":"2026-10-12","travel_mode":"FLIGHT","pickup_by":"Zain"},
        {"guests":"Amina","arrival_date":"2026-10-09","travel_mode":"TRAIN","pickup_by":"Ali"}
    ]'::jsonb, shared_id, null, null, null);
    assert (select jsonb_array_length(arrivals) = 2 and arrival_date = '2026-10-09' and pickup_by = 'Ali'
        and accommodation_id = shared_id and departure_details = 'Departure kept'
        from public.family_logistics where family_id = family_a), 'Split arrival save failed';
    perform public.save_family_departure(family_a, 'CAR', '2026-10-16', null, null);
    assert (select jsonb_array_length(arrivals) = 2 from public.family_logistics where family_id = family_a),
        'Departure save changed pickups';
    begin
        perform public.save_family_arrivals(family_a, '[{"arrival_date":"2026-02-30"}]', null, 'HOUSE', 'Bad pickup house', null);
        raise exception 'Invalid pickup date was accepted';
    exception when check_violation then null;
    end;
    assert (select jsonb_array_length(arrivals) = 2 and accommodation_id = shared_id
        from public.family_logistics where family_id = family_a), 'Invalid pickup modified saved details';
    perform public.save_family_arrivals(family_a, '[{"guests":"Amina","arrival_date":"2026-10-09"}]', shared_id, null, null, null);
    assert (select jsonb_array_length(arrivals) = 1 from public.family_logistics where family_id = family_a), 'Pickup removal failed';
    perform public.save_family_arrivals(family_a, '[]', shared_id, null, null, null);
    assert (select arrivals = '[]'::jsonb and arrival_date is null and pickup_by is null
        and accommodation_id = shared_id and departure_mode = 'CAR'
        from public.family_logistics where family_id = family_a), 'Clearing pickups affected other details';
    begin
        perform public.save_family_arrivals(pending_family, '[]', null, null, null, null);
        raise exception 'Unconfirmed pickups were accepted';
    exception when raise_exception then
        if sqlerrm not like 'This family no longer%' then raise; end if;
    end;

    execute 'set local role anon';
    begin
        perform public.save_family_arrivals(family_a, '[]', null, null, null, null);
        raise exception 'Anonymous pickup-list writes were allowed';
    exception when insufficient_privilege then null;
    end;
    begin
        perform public.save_family_departure(family_a, null, null, null, 'Ali');
        raise exception 'Anonymous departure writes were allowed';
    exception when insufficient_privilege then null;
    end;
    begin
        perform public.save_family_logistics(family_a, null, null, null, null, null, null, null, 'Ali');
        raise exception 'Anonymous pickup writes were allowed';
    exception when insufficient_privilege then null;
    end;
    begin
        perform * from public.family_logistics;
        raise exception 'Anonymous logistics access was allowed';
    exception when insufficient_privilege then null;
    end;
    begin
        perform * from public.accommodations;
        raise exception 'Anonymous accommodation access was allowed';
    exception when insufficient_privilege then null;
    end;
    begin
        perform public.save_family_logistics(family_a, null, null, null, null, null, null, null);
        raise exception 'Anonymous logistics writes were allowed';
    exception when insufficient_privilege then null;
    end;
    raise notice 'All logistics database checks passed';
end;
$$;
rollback;
