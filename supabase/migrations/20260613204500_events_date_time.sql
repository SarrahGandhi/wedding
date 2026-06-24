alter table "public"."events"
  alter column "date" type timestamp without time zone
  using "date"::timestamp without time zone;
