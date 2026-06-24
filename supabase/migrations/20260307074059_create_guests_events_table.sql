create type "public"."event_rsvp_status" as enum ('PENDING', 'ACCEPTED', 'DECLINED');

create type "public"."guest_category" as enum ('MALE', 'FEMALE', 'CHILD');

create type "public"."guest_side" as enum ('BRIDE', 'GROOM');


  create table "public"."event_guests_rsvp" (
    "id" integer generated always as identity not null,
    "event_id" integer not null,
    "guest_id" integer not null,
    "rsvp_status" public.event_rsvp_status not null default 'PENDING'::public.event_rsvp_status,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."event_guests_rsvp" enable row level security;


  create table "public"."events" (
    "id" integer generated always as identity not null,
    "name" text not null,
    "date" timestamp without time zone not null,
    "location" text,
    "dress_code" text,
    "details" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."events" enable row level security;


  create table "public"."guest_families" (
    "id" integer generated always as identity not null,
    "email" text[] not null,
    "phone" text,
    "side" public.guest_side not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."guest_families" enable row level security;


  create table "public"."guests" (
    "id" integer generated always as identity not null,
    "name" text not null,
    "category" public.guest_category not null,
    "family_id" integer,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."guests" enable row level security;

CREATE UNIQUE INDEX event_guests_rsvp_event_id_guest_id_key ON public.event_guests_rsvp USING btree (event_id, guest_id);

CREATE UNIQUE INDEX event_guests_rsvp_pkey ON public.event_guests_rsvp USING btree (id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX guest_families_pkey ON public.guest_families USING btree (id);

CREATE UNIQUE INDEX guests_pkey ON public.guests USING btree (id);

alter table "public"."event_guests_rsvp" add constraint "event_guests_rsvp_pkey" PRIMARY KEY using index "event_guests_rsvp_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."guest_families" add constraint "guest_families_pkey" PRIMARY KEY using index "guest_families_pkey";

alter table "public"."guests" add constraint "guests_pkey" PRIMARY KEY using index "guests_pkey";

alter table "public"."event_guests_rsvp" add constraint "event_guests_rsvp_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."event_guests_rsvp" validate constraint "event_guests_rsvp_event_id_fkey";

alter table "public"."event_guests_rsvp" add constraint "event_guests_rsvp_event_id_guest_id_key" UNIQUE using index "event_guests_rsvp_event_id_guest_id_key";

alter table "public"."event_guests_rsvp" add constraint "event_guests_rsvp_guest_id_fkey" FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE not valid;

alter table "public"."event_guests_rsvp" validate constraint "event_guests_rsvp_guest_id_fkey";

alter table "public"."guests" add constraint "guests_family_id_fkey" FOREIGN KEY (family_id) REFERENCES public.guest_families(id) ON DELETE SET NULL not valid;

alter table "public"."guests" validate constraint "guests_family_id_fkey";

grant references on table "public"."event_guests_rsvp" to "anon";

grant select on table "public"."event_guests_rsvp" to "anon";

grant trigger on table "public"."event_guests_rsvp" to "anon";

grant truncate on table "public"."event_guests_rsvp" to "anon";

grant delete on table "public"."event_guests_rsvp" to "authenticated";

grant insert on table "public"."event_guests_rsvp" to "authenticated";

grant references on table "public"."event_guests_rsvp" to "authenticated";

grant select on table "public"."event_guests_rsvp" to "authenticated";

grant trigger on table "public"."event_guests_rsvp" to "authenticated";

grant truncate on table "public"."event_guests_rsvp" to "authenticated";

grant update on table "public"."event_guests_rsvp" to "authenticated";

grant delete on table "public"."event_guests_rsvp" to "service_role";

grant insert on table "public"."event_guests_rsvp" to "service_role";

grant references on table "public"."event_guests_rsvp" to "service_role";

grant select on table "public"."event_guests_rsvp" to "service_role";

grant trigger on table "public"."event_guests_rsvp" to "service_role";

grant truncate on table "public"."event_guests_rsvp" to "service_role";

grant update on table "public"."event_guests_rsvp" to "service_role";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant references on table "public"."guest_families" to "anon";

grant select on table "public"."guest_families" to "anon";

grant trigger on table "public"."guest_families" to "anon";

grant truncate on table "public"."guest_families" to "anon";

grant delete on table "public"."guest_families" to "authenticated";

grant insert on table "public"."guest_families" to "authenticated";

grant references on table "public"."guest_families" to "authenticated";

grant select on table "public"."guest_families" to "authenticated";

grant trigger on table "public"."guest_families" to "authenticated";

grant truncate on table "public"."guest_families" to "authenticated";

grant update on table "public"."guest_families" to "authenticated";

grant delete on table "public"."guest_families" to "service_role";

grant insert on table "public"."guest_families" to "service_role";

grant references on table "public"."guest_families" to "service_role";

grant select on table "public"."guest_families" to "service_role";

grant trigger on table "public"."guest_families" to "service_role";

grant truncate on table "public"."guest_families" to "service_role";

grant update on table "public"."guest_families" to "service_role";

grant references on table "public"."guests" to "anon";

grant select on table "public"."guests" to "anon";

grant trigger on table "public"."guests" to "anon";

grant truncate on table "public"."guests" to "anon";

grant delete on table "public"."guests" to "authenticated";

grant insert on table "public"."guests" to "authenticated";

grant references on table "public"."guests" to "authenticated";

grant select on table "public"."guests" to "authenticated";

grant trigger on table "public"."guests" to "authenticated";

grant truncate on table "public"."guests" to "authenticated";

grant update on table "public"."guests" to "authenticated";

grant delete on table "public"."guests" to "service_role";

grant insert on table "public"."guests" to "service_role";

grant references on table "public"."guests" to "service_role";

grant select on table "public"."guests" to "service_role";

grant trigger on table "public"."guests" to "service_role";

grant truncate on table "public"."guests" to "service_role";

grant update on table "public"."guests" to "service_role";


  create policy "Anon can update event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for update
  to anon
using (true)
with check (true);



  create policy "Anon can view event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for select
  to anon
using (true);



  create policy "Authenticated can delete event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated can insert event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated can update event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated can view event guest RSVP"
  on "public"."event_guests_rsvp"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Anon can view events"
  on "public"."events"
  as permissive
  for select
  to anon
using (true);



  create policy "Authenticated can delete events"
  on "public"."events"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated can insert events"
  on "public"."events"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated can update events"
  on "public"."events"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated can view events"
  on "public"."events"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Anon can view guest families"
  on "public"."guest_families"
  as permissive
  for select
  to anon
using (true);



  create policy "Authenticated can delete guest families"
  on "public"."guest_families"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated can insert guest families"
  on "public"."guest_families"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated can update guest families"
  on "public"."guest_families"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated can view guest families"
  on "public"."guest_families"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Anon can view guests"
  on "public"."guests"
  as permissive
  for select
  to anon
using (true);



  create policy "Authenticated can delete guests"
  on "public"."guests"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Authenticated can insert guests"
  on "public"."guests"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated can update guests"
  on "public"."guests"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Authenticated can view guests"
  on "public"."guests"
  as permissive
  for select
  to authenticated
using (true);



