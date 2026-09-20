-- Run against the migrated local database. All fixtures are rolled back.
begin;
set local role authenticated;

do $$
declare
  task_id integer;
  groom_task_id integer;
  affected integer;
begin
  insert into public.tasks (name, owner, due_date, side)
    values ('Confirm menu', 'Sarrah', '2026-10-12', 'BRIDE') returning id into task_id;
  insert into public.tasks (name, owner, due_date, side)
    values ('Confirm transport', 'Murtaza', '2026-10-12', 'GROOM') returning id into groom_task_id;
  assert (select count(*) = 1 from public.tasks where id in (task_id, groom_task_id) and side = 'BRIDE'),
    'Bride filtering excludes groom tasks';
  assert (select count(*) = 1 from public.tasks where id in (task_id, groom_task_id) and side = 'GROOM'),
    'Groom filtering excludes bride tasks';
  assert (select not completed from public.tasks where id = task_id), 'New tasks start incomplete';

  update public.tasks set completed = true where id = task_id and revision = 1;
  assert (select completed and revision = 2 from public.tasks where id = task_id), 'Completion increments revision';

  update public.tasks set name = 'Stale edit' where id = task_id and revision = 1;
  get diagnostics affected = row_count;
  assert affected = 0, 'Stale edits cannot overwrite tasks';

  update public.tasks set completed = false, owner = 'Murtaza', due_date = '2026-10-14'
    where id = task_id and revision = 2;
  assert (select not completed and owner = 'Murtaza' and due_date = '2026-10-14' and revision = 3
    from public.tasks where id = task_id), 'Admins can reopen tasks and change owners and dates';

  update public.tasks set side = 'GROOM' where id = task_id and revision = 3;
  assert (select side = 'GROOM' and revision = 4 from public.tasks where id = task_id),
    'Admins can move tasks to the other side';
  begin
    update public.tasks set side = null where id = task_id;
    raise exception 'Missing task sides were accepted';
  exception when not_null_violation then null;
  end;

  begin
    update public.tasks set name = ' ' where id = task_id;
    raise exception 'Blank task names were accepted';
  exception when check_violation then null;
  end;
  begin
    update public.tasks set owner = ' ' where id = task_id;
    raise exception 'Blank owners were accepted';
  exception when check_violation then null;
  end;
  begin
    update public.tasks set due_date = null where id = task_id;
    raise exception 'Missing due dates were accepted';
  exception when not_null_violation then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform * from public.tasks;
    raise exception 'Anonymous visitors could read tasks';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks (name, owner, due_date, side) values ('Anonymous task', 'Guest', '2026-10-12', 'BRIDE');
    raise exception 'Anonymous visitors could create tasks';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.tasks set completed = true;
    raise exception 'Anonymous visitors could update tasks';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
