-- All fixtures and RSVP queue changes are rolled back.
begin;
do $$
declare
  fixed_family integer;
  unlimited_family integer;
  overfilled_family integer;
  admin_guest integer;
  invited_event integer;
  added integer;
begin
  insert into public.guest_families (email, side, family_name, male_guest_slots, female_guest_slots)
    values ('{}', 'BRIDE', 'Fixed guest limit test', 2, 3) returning id into fixed_family;
  insert into public.guests (name, category, family_id)
    values ('Admin male', 'MALE', fixed_family) returning id into admin_guest;
  insert into public.guests (name, category, family_id)
    values ('Admin female', 'FEMALE', fixed_family);
  insert into public.guests (name, category, family_id, added_by_family)
    values ('Family female', 'FEMALE', fixed_family, true);
  insert into public.events (name, date, time)
    values ('Guest limit test event', '2026-10-22', '12:00') returning id into invited_event;
  insert into public.event_guests_rsvp (event_id, guest_id, rsvp_status)
    values (invited_event, admin_guest, 'ACCEPTED');

  insert into public.guest_families (email, side, family_name, allow_all_guests)
    values ('{}', 'GROOM', 'Unlimited guest test', true) returning id into unlimited_family;
  insert into public.guests (name, category, family_id)
    values ('Existing unlimited guest', 'FEMALE', unlimited_family);

  insert into public.guest_families (email, side, family_name, male_guest_slots, female_guest_slots)
    values ('{}', 'BRIDE', 'Existing names over limit test', 0, 1) returning id into overfilled_family;
  insert into public.guests (name, category, family_id)
    values ('Existing male', 'MALE', overfilled_family);

  execute 'set local role anon';
  assert (select count(*) = 3 from public.guests where family_id = fixed_family),
    'Guests must see names entered by both admin and family';
  assert (select count(*) = 1 from public.guests where family_id = unlimited_family),
    'All mode must retain the visible admin-entered names';

  -- Only one of each category remains, despite two names having been added by admin.
  begin
    perform public.add_family_guests(fixed_family, array['Extra male one', 'Extra male two'], array['MALE', 'MALE']::public.guest_category[]);
    raise exception 'Admin-entered names did not count toward the male limit';
  exception when raise_exception then
    if sqlerrm <> 'There are not enough male guest spots remaining.' then raise; end if;
  end;
  begin
    perform public.add_family_guests(fixed_family, array['Extra female one', 'Extra female two'], array['FEMALE', 'FEMALE']::public.guest_category[]);
    raise exception 'Admin-entered names did not count toward the female limit';
  exception when raise_exception then
    if sqlerrm <> 'There are not enough female guest spots remaining.' then raise; end if;
  end;
  assert (select count(*) = 3 from public.guests where family_id = fixed_family), 'Rejected submissions must not insert names';

  added := public.add_family_guests(fixed_family, array['Remaining male', 'Remaining female'], array['MALE', 'FEMALE']::public.guest_category[]);
  assert added = 2, 'The remaining slots must still be usable';
  assert (select count(*) = 5 from public.guests where family_id = fixed_family), 'Exactly the configured total can be filled';
  assert (select rsvp_status = 'ACCEPTED' from public.event_guests_rsvp where guest_id = admin_guest and event_id = invited_event),
    'Existing replies must be preserved';
  assert (select count(*) = 2 from public.event_guests_rsvp r join public.guests g on g.id = r.guest_id
    where g.family_id = fixed_family and g.name in ('Remaining male', 'Remaining female') and r.event_id = invited_event),
    'New guests inherit the family event selection';

  begin
    perform public.add_family_guests(fixed_family, array['One too many'], array['MALE']::public.guest_category[]);
    raise exception 'A full invitation accepted another name';
  exception when raise_exception then
    if sqlerrm <> 'There are not enough male guest spots remaining.' then raise; end if;
  end;

  added := public.add_family_guests(unlimited_family, array['Unlimited male', 'Unlimited female', 'Unlimited child'], array['MALE', 'FEMALE', 'CHILD']::public.guest_category[]);
  assert added = 3, 'All mode permits more names regardless of existing names';
  assert (select count(*) = 4 from public.guests where family_id = unlimited_family), 'All names remain visible after adding guests';
  begin
    perform public.add_family_guests(unlimited_family, array['Existing unlimited guest'], array['FEMALE']::public.guest_category[]);
    raise exception 'An existing admin-entered name could be added twice';
  exception when raise_exception then
    if sqlerrm not like 'A guest named % is already on this invitation.' then raise; end if;
  end;

  added := public.add_family_guests(overfilled_family, array['Remaining female'], array['FEMALE']::public.guest_category[]);
  assert added = 1, 'An existing over-limit category must not block another category with room';
end;
$$;
rollback;
