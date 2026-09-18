-- Run against a migrated local database with psql -v ON_ERROR_STOP=1.
-- Every test row and update is rolled back.
begin;
set local role authenticated;

do $$
declare
  category_id integer;
  new_revision integer;
  affected integer;
begin
  insert into public.budget_categories
    (name, total_paise, split_type, bride_share_paise, groom_share_paise)
    values ('Budget test', 10001, 'EQUAL', 5000, 5001)
    returning id into category_id;

  update public.budget_categories set bride_paid_paise = 9000
    where id = category_id and revision = 1 returning revision into new_revision;
  assert new_revision = 2, 'Updating payments must advance the revision';

  update public.budget_categories set bride_paid_paise = 100
    where id = category_id and revision = 1;
  get diagnostics affected = row_count;
  assert affected = 0, 'A stale revision must not overwrite payments';

  begin
    update public.budget_categories set bride_paid_paise = -1 where id = category_id;
    raise exception 'Negative payments were accepted';
  exception when check_violation then null;
  end;

  begin
    update public.budget_categories set bride_share_paise = 8000 where id = category_id;
    raise exception 'Shares that do not sum to the total were accepted';
  exception when check_violation then null;
  end;

  begin
    update public.budget_categories set split_type = 'GROOM' where id = category_id;
    raise exception 'Shares inconsistent with the split were accepted';
  exception when check_violation then null;
  end;

  update public.budget_categories set split_type = 'CUSTOM', bride_share_paise = 2000,
    groom_share_paise = 8001, groom_paid_paise = 12000 where id = category_id;
  assert (select bride_paid_paise + groom_paid_paise > total_paise
    from public.budget_categories where id = category_id), 'Vendor overpayments must remain recordable';

  delete from public.budget_categories where id = category_id;
  assert not exists (select 1 from public.budget_categories where id = category_id),
    'Admins must be able to delete a category';
end;
$$;

set local role anon;
do $$
begin
  begin
    perform * from public.budget_categories;
    raise exception 'Anonymous visitors could read budget data';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.budget_categories
      (name, total_paise, bride_share_paise, groom_share_paise)
      values ('Anonymous test', 0, 0, 0);
    raise exception 'Anonymous visitors could write budget data';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
