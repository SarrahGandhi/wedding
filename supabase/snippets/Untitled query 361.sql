alter table public.guest_families
    add column if not exists male_guest_slots integer not null default 0,
    add column if not exists female_guest_slots integer not null default 0,
    add column if not exists allow_all_guests boolean not null default false;

select pg_notify('pgrst', 'reload schema');

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'guest_families'
  and column_name in (
      'family_name',
      'male_guest_slots',
      'female_guest_slots',
      'allow_all_guests'
  )
order by column_name;