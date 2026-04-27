-- Require every guest to belong to a family.

alter table public.guests alter column family_id set not null;
