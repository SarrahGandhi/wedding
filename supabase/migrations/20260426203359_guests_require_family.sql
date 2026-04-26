-- Require every guest to belong to a family.
-- Backfill any orphan rows (family_id IS NULL) into a single fallback family
-- on the bride's side so the NOT NULL constraint can be added safely.

do $$
declare
  fallback_id bigint;
begin
  if exists (select 1 from public.guests where family_id is null) then
    insert into public.guest_families (side, email)
    values ('BRIDE', array[]::text[])
    returning id into fallback_id;

    update public.guests
    set family_id = fallback_id
    where family_id is null;
  end if;
end $$;

alter table public.guests alter column family_id set not null;
