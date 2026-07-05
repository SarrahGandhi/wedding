# dispatch-rsvp-emails

Sends the debounced RSVP confirmation emails. It is **not** called from the
app — it runs on a schedule and collapses bursts of RSVP changes into one
email per family with the latest state.

## How it works

1. A trigger on `event_guests_rsvp` (`trg_enqueue_rsvp_email`, shipped in
   migration `20260705000000_rsvp_email_queue.sql`) marks a guest's family
   **dirty** in `rsvp_email_queue` whenever a `rsvp_status` actually changes —
   whether the guest edits it on `/invitation` or an admin edits it.
2. `pg_cron` invokes this function every ~5 minutes.
3. For each family that is dirty **and** whose last change was ≥
   `RSVP_QUIET_MINUTES` ago **and** that hasn't been emailed within
   `RSVP_COOLDOWN_MINUTES`, it builds the current invitation snapshot, renders
   the email (`_shared/render.ts`), and sends it to every address in
   `guest_families.email` (skips families with no email).
4. It stamps `last_sent_at` and clears `dirty` — unless a newer change landed
   mid-run, in which case the family stays queued for the next cycle.

So 10 rapid changes → the quiet window keeps resetting → **1 email** once the
family stops, reflecting the final state.

## Config (function secrets)

| Secret | Purpose | Default |
| --- | --- | --- |
| `DISPATCH_SECRET` | Bearer token the cron job must present. **Required.** | — |
| `RESEND_API_KEY` | Resend API key. | already set |
| `SITE_URL` | Base URL for the "View or update your RSVP" button. | `https://murtazasarrah.ca` |
| `RSVP_QUIET_MINUTES` | Quiet window before sending. | `10` |
| `RSVP_COOLDOWN_MINUTES` | Min gap between emails per family. | `60` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Deploy

```bash
supabase functions deploy dispatch-rsvp-emails
supabase secrets set DISPATCH_SECRET="<long-random-string>"
supabase secrets set SITE_URL="https://murtazasarrah.ca"
```

Then run `setup-cron.sql` in the SQL editor (see the file for details) to enable
`pg_cron` / `pg_net` and schedule the job.

## Test manually

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/dispatch-rsvp-emails" \
  -H "Authorization: Bearer $DISPATCH_SECRET"
```
