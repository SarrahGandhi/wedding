alter table "public"."events"
  add column if not exists "time" time without time zone;

do $$
declare
  date_column_type text;
begin
  select data_type
  into date_column_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'date';

  if date_column_type like 'timestamp%' then
    execute 'update "public"."events" set "time" = coalesce("time", "date"::time, time ''00:00'')';
  else
    update "public"."events"
    set "time" = coalesce("time", time '00:00');
  end if;
end $$;

alter table "public"."events"
  alter column "date" type date
  using "date"::date;

alter table "public"."events"
  alter column "time" set not null;
