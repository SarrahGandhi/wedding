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

    perform public.save_family_guest_rooms(family_a, '[]', null, 'HOTEL', 'Guest room test hotel', null,
        jsonb_build_object(guest_a::text, ' 02A '));
    assert (select guest_rooms ->> guest_a::text = '02A' from public.family_logistics where family_id = family_a), 'Guest room did not persist';
    begin
        perform public.save_family_guest_rooms(family_a, '[]', null, 'HOTEL', 'Invalid room test', null,
            jsonb_build_object(guest_b::text, '12'));
        raise exception 'Guest from another family was accepted';
    exception when raise_exception then
        if sqlerrm not like 'A guest is no longer confirmed%' then raise; end if;
    end;
    assert (select guest_rooms ->> guest_a::text = '02A' from public.family_logistics where family_id = family_a), 'Failed save changed guest rooms';
    begin
        perform public.save_family_guest_rooms(family_a, '[]', null, 'HOTEL', 'Guest room test hotel', null,
            jsonb_build_object(guest_a::text, repeat('a', 41)));
        raise exception 'Oversized room was accepted';
    exception when check_violation then null;
    end;
    perform public.save_family_guest_rooms(family_a, '[]', null, 'HOTEL', 'Guest room test hotel', null,
        jsonb_build_object(guest_a::text, null));
    assert (select guest_rooms -> guest_a::text = 'null'::jsonb from public.family_logistics where family_id = family_a), 'Room could not be cleared';
end;
$$;
rollback;
