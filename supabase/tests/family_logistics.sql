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

    perform public.save_family_logistics(family_a, 'FLIGHT', 'Test flight', '2026-10-09', null, 'HOTEL', 'Logistics test hotel', '10');
    select accommodation_id into shared_id from public.family_logistics where family_id = family_a;
    perform public.save_family_logistics(family_b, 'TRAIN', null, '2026-10-10', shared_id, null, null, null);
    if (select count(*) from public.family_logistics where accommodation_id = shared_id) <> 2 then
        raise exception 'Shared hotel room assignment failed';
    end if;

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

    perform public.save_family_logistics(family_a, 'TRAIN', 'Pickup needed', null, null, 'HOUSE', 'Logistics test house', ' 2A ', ' 01234 ', ' B2 ', 'stale flight');
    select accommodation_id into shared_id from public.family_logistics where family_id = family_a;
    if (select room_number from public.accommodations where id = shared_id) is distinct from '2A' then
        raise exception 'House room was not saved';
    end if;
    if (select accommodation_id from public.family_logistics where family_id = family_b) <> second_id then
        raise exception 'House room assignment changed another family';
    end if;
    if not exists (select 1 from public.family_logistics where family_id = family_a
        and train_number = '01234' and coach_number = 'B2' and flight_number is null and travel_details = 'Pickup needed') then
        raise exception 'Train details were not saved correctly';
    end if;
    perform public.save_family_logistics(family_b, 'FLIGHT', null, null, null, 'HOUSE', ' LOGISTICS TEST HOUSE ', '2a', 'stale train', 'stale coach', ' AI 101 ');
    if (select accommodation_id from public.family_logistics where family_id = family_b) <> shared_id then
        raise exception 'Shared house room was not reused';
    end if;
    perform public.save_family_logistics(family_a, 'FLIGHT', null, null, shared_id, null, null, null, null, null, ' AI 101 ');
    if not exists (select 1 from public.family_logistics where family_id = family_a
        and train_number is null and coach_number is null and flight_number = 'AI 101') then
        raise exception 'Switching to flight did not clear train details';
    end if;
    perform public.save_family_logistics(family_a, 'CAR', null, null, shared_id, null, null, null);
    if exists (select 1 from public.family_logistics where family_id = family_a
        and (train_number is not null or coach_number is not null or flight_number is not null)) then
        raise exception 'Switching to car did not clear travel numbers';
    end if;
    begin
        update public.family_logistics set flight_number = 'AI 101' where family_id = family_a;
        raise exception 'Travel number mode constraint was bypassed';
    exception when check_violation then null;
    end;
    begin
        perform public.save_family_logistics(family_a, 'TRAIN', null, null, shared_id, null, null, null, repeat('1', 41), null, null);
        raise exception 'Oversized train number was accepted';
    exception when check_violation then null;
    end;
    begin
        insert into public.accommodations(kind, name, room_number) values ('HOUSE', 'Invalid house room', '   ');
        raise exception 'House room constraint was bypassed';
    exception when check_violation then null;
    end;

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

    execute 'set local role anon';
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
