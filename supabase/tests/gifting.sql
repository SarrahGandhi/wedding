-- Run after the private gifting migration against a local/test database.
begin;
insert into auth.users (id, email, email_confirmed_at)
select gen_random_uuid(), 'thesarrahgandhi@gmail.com', now()
where not exists (select 1 from auth.users where lower(email) = 'thesarrahgandhi@gmail.com');
update auth.users set email_confirmed_at = now() where lower(email) = 'thesarrahgandhi@gmail.com';
select set_config('request.jwt.claim.sub', (select id::text from auth.users where lower(email) = 'thesarrahgandhi@gmail.com' limit 1), true);
-- Tests leave existing plans untouched after rollback.
delete from public.gifting_plans where owner_id = auth.uid();
set local role authenticated;
do $$
declare affected integer;
begin
  if not public.can_access_gifting() then raise exception 'Owner access denied'; end if;
  insert into public.gifting_plans (recipients) values ('[]');
  update public.gifting_plans set recipients = '[]' where owner_id = auth.uid() and revision = 1;
  if (select revision from public.gifting_plans where owner_id = auth.uid()) <> 2 then
    raise exception 'Revision did not advance';
  end if;
  update public.gifting_plans set recipients = '[]' where owner_id = auth.uid() and revision = 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale save overwrote plan'; end if;
end;
$$;
reset role;
insert into auth.users (id, email, email_confirmed_at) values ('10000000-0000-4000-8000-000000000099', 'gifting-access-test@example.invalid', now());
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000099', true);
set local role authenticated;
do $$
begin
  if public.can_access_gifting() then raise exception 'Other admin received access'; end if;
  if exists (select 1 from public.gifting_plans) then raise exception 'Other admin can read gifting'; end if;
  begin
    insert into public.gifting_plans (recipients) values ('[]');
    raise exception 'Other admin can create gifting data';
  exception when insufficient_privilege then null;
  end;
  update public.gifting_plans set recipients = '[]';
  if found then raise exception 'Other admin can edit gifting'; end if;
end;
$$;
reset role;
do $$
begin
  if has_table_privilege('anon', 'public.gifting_plans', 'SELECT')
    or has_table_privilege('anon', 'public.gifting_plans', 'INSERT')
    or has_table_privilege('anon', 'public.gifting_plans', 'UPDATE') then
    raise exception 'Anonymous gifting access is enabled';
  end if;
end;
$$;
rollback;
