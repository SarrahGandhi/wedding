begin;
set local role authenticated;
do $$
declare
  event integer;
  entry integer;
  affected integer;
begin
  insert into public.events (name, date, time) values ('Wedding Flow test', '2026-12-01', '18:00') returning id into event;
  insert into public.wedding_flow_entries (event_id, side, category, title, time)
    values (event, 'BRIDE', 'Jewellery', 'Necklace', '17:00') returning id into entry;
  update public.wedding_flow_entries set completed = true where id = entry and revision = 1;
  assert (select completed and revision = 2 from public.wedding_flow_entries where id = entry), 'Completion increments revision';
  update public.wedding_flow_entries set title = 'Stale update' where id = entry and revision = 1;
  get diagnostics affected = row_count;
  assert affected = 0, 'Stale changes are rejected';
  begin
    update public.wedding_flow_entries set side = 'INVALID' where id = entry;
    raise exception 'Invalid side accepted';
  exception when check_violation then null;
  end;
  delete from public.events where id = event;
  assert not exists (select 1 from public.wedding_flow_entries where id = entry), 'Deleting an event removes its flow';
  assert not has_table_privilege('anon', 'public.wedding_flow_entries', 'SELECT'), 'Anonymous users cannot read flows';
end;
$$;
rollback;
