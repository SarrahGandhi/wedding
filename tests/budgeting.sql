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

  assert (select amounts_paise is null from public.budget_categories where id = category_id),
    'Existing categories retain their single total';
  update public.budget_categories set amounts_paise = array[5000, 5001] where id = category_id;
  assert (select public.budget_amounts_total(amounts_paise) = total_paise from public.budget_categories where id = category_id),
    'Multiple amounts sum exactly to the saved category total';
  begin
    update public.budget_categories set amounts_paise = array[100] where id = category_id;
    raise exception 'Mismatched totals were accepted';
  exception when check_violation then null;
  end;
  begin
    update public.budget_categories set amounts_paise = array[]::bigint[] where id = category_id;
    raise exception 'Empty amounts were accepted';
  exception when check_violation then null;
  end;
  begin
    update public.budget_categories set amounts_paise = array[-1, 10002] where id = category_id;
    raise exception 'Negative amounts were accepted';
  exception when check_violation then null;
  end;
  begin
    update public.budget_categories set amounts_paise = array[null, 10001] where id = category_id;
    raise exception 'Null amounts were accepted';
  exception when check_violation then null;
  end;
  assert public.budget_amounts_total(array[99999999999, 1]) is null, 'Combined overflow is rejected';
  assert public.budget_amounts_total(array[[5000, 5001]]) is null, 'Nested amount arrays are rejected';

  update public.budget_categories set amounts_paise = array[5000], total_paise = 5000,
    bride_share_paise = 2000, groom_share_paise = 3000 where id = category_id;
  assert (select total_paise = 5000 and bride_paid_paise = 9000 and groom_paid_paise = 12000
    from public.budget_categories where id = category_id), 'Removing an amount updates the total without changing recorded payments';

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
