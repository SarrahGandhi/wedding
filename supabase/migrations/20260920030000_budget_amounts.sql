-- NULL preserves existing categories as a single total until they are edited.
alter table public.budget_categories add column amounts_paise bigint[];

create function public.budget_amounts_total(amounts bigint[])
returns bigint language plpgsql immutable strict set search_path = '' as $$
declare
  amount bigint;
  total bigint := 0;
begin
  if cardinality(amounts) = 0 or array_ndims(amounts) <> 1 then
    return null;
  end if;
  foreach amount in array amounts loop
    if amount is null or amount < 0 or amount > 99999999999 then
      return null;
    end if;
    total := total + amount;
    if total > 99999999999 then
      return null;
    end if;
  end loop;
  return total;
end;
$$;

alter table public.budget_categories
  add constraint budget_amounts_match_total check (
    amounts_paise is null or
    (total_paise = public.budget_amounts_total(amounts_paise)) is true
  );

notify pgrst, 'reload schema';
