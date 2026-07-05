-- RSVP confirmation email queue + debounce.
--
-- When a guest's rsvp_status changes (self-serve on the invitation page or an
-- admin edit) we do NOT email immediately. Instead the guest's family is
-- marked "dirty" in this queue. A scheduled worker (the dispatch-rsvp-emails
-- edge function, invoked by pg_cron) waits for a quiet period and then sends
-- ONE email per family reflecting the latest state — so a burst of changes
-- collapses into a single confirmation email.

create table "rsvp_email_queue" (
    family_id integer primary key references "guest_families"(id) on delete cascade,
    -- true while there are unsent changes for this family.
    dirty boolean not null default true,
    -- start of the current unsent batch (first change after the last send).
    batch_started_at timestamptz not null default now(),
    -- most recent change; the quiet-window debounce is measured from here.
    last_change_at timestamptz not null default now(),
    -- when we last emailed this family; drives the per-family cooldown.
    last_sent_at timestamptz
);

comment on table "rsvp_email_queue" is
    'Debounce state for RSVP confirmation emails, one row per family.';

-- Only the SECURITY DEFINER trigger below and the service-role dispatcher
-- touch this table, so RLS is enabled with no anon/authenticated policies.
alter table "rsvp_email_queue" enable row level security;

-- Marks a guest's family as having unsent RSVP changes. Runs as owner
-- (SECURITY DEFINER) because anon may update rsvp_status but has no rights
-- on rsvp_email_queue.
create or replace function public.enqueue_rsvp_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    fam_id integer;
begin
    select family_id into fam_id from public.guests where id = NEW.guest_id;
    if fam_id is null then
        return NEW;
    end if;

    insert into public.rsvp_email_queue as q
        (family_id, dirty, batch_started_at, last_change_at)
    values (fam_id, true, now(), now())
    on conflict (family_id) do update
    set last_change_at = now(),
        -- Only reset the batch start when re-dirtying a previously clean row.
        batch_started_at = case when q.dirty then q.batch_started_at else now() end,
        dirty = true;

    return NEW;
end;
$$;

-- Fire only when the status actually changes: skips no-op writes and the
-- PENDING rows created when an admin first adds guests to an event.
create trigger "trg_enqueue_rsvp_email"
after update of rsvp_status on "event_guests_rsvp"
for each row
when (OLD.rsvp_status is distinct from NEW.rsvp_status)
execute function public.enqueue_rsvp_email();
