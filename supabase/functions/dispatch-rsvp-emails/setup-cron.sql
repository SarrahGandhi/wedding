-- One-time setup on the HOSTED Supabase project (run in the SQL editor).
--
-- This is intentionally NOT a migration: it enables extensions and schedules a
-- cron job with project-specific URLs/secrets, which would break `supabase db
-- reset` in local dev. The queue table + trigger DO ship as a migration
-- (20260705000000_rsvp_email_queue.sql); only the scheduling lives here.
--
-- Prerequisites:
--   1. Deploy the function:   supabase functions deploy dispatch-rsvp-emails
--   2. Set function secrets:
--        supabase secrets set DISPATCH_SECRET="<a-long-random-string>"
--        supabase secrets set SITE_URL="https://murtazasarrah.ca"
--      (RESEND_API_KEY is already set. SUPABASE_URL and
--       SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
--   3. Run this file with the same DISPATCH_SECRET below.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store the project URL + dispatch secret in Vault so they aren't inlined in
-- the cron command. Re-run these (or use vault.update_secret) to change them.
select vault.create_secret(
  'https://<YOUR-PROJECT-REF>.supabase.co',
  'project_url'
);
select vault.create_secret(
  '<SAME-VALUE-AS-DISPATCH_SECRET>',
  'dispatch_secret'
);

-- Run the debounced dispatcher every 5 minutes. The quiet window (~10 min) is
-- enforced inside the function, so a 5-minute cadence is plenty.
select cron.schedule(
  'dispatch-rsvp-emails',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/dispatch-rsvp-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Handy management queries:
--   select * from cron.job;                       -- list schedules
--   select * from cron.job_run_details            -- recent runs
--     order by start_time desc limit 20;
--   select cron.unschedule('dispatch-rsvp-emails'); -- remove the job
