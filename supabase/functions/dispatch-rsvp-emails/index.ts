import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "../_shared/email.ts";
import {
  renderRsvpConfirmationEmail,
  type EmailEvent,
  type RsvpStatus,
} from "../_shared/render.ts";

// Debounce knobs (overridable via function secrets).
const QUIET_MINUTES = Number(Deno.env.get("RSVP_QUIET_MINUTES") ?? "10");
const COOLDOWN_MINUTES = Number(Deno.env.get("RSVP_COOLDOWN_MINUTES") ?? "60");
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://murtazasarrah.ca")
  .replace(/\/+$/, "");

// Shared secret the cron job must present. If unset the endpoint is open,
// so it MUST be configured in any real deployment.
const DISPATCH_SECRET = Deno.env.get("DISPATCH_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const firstName = (name: string) => name.split(" ")[0];

function formatEventDate(date: string, time: string | null): string {
  const d = (date ?? "").slice(0, 10);
  const t = (time ?? "").slice(0, 5) || "00:00";
  const parsed = new Date(`${d}T${t}`);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface EventRow {
  id: number;
  name: string;
  date: string;
  time: string | null;
  location: string | null;
  dress_code: string | null;
}

interface RsvpRow {
  guest_id: number;
  rsvp_status: RsvpStatus;
  events: EventRow | null;
}

async function processFamily(
  supabase: SupabaseClient,
  familyId: number,
  lastChangeAt: string,
): Promise<Record<string, unknown>> {
  const { data: family } = await supabase
    .from("guest_families")
    .select("id, side, email")
    .eq("id", familyId)
    .single();

  // Clears the dirty flag without stamping last_sent_at — used when there is
  // nothing to send. Guarded on last_change_at so a change that lands mid-run
  // keeps the row dirty for the next cycle.
  const clearDirty = async () => {
    await supabase
      .from("rsvp_email_queue")
      .update({ dirty: false })
      .eq("family_id", familyId)
      .eq("last_change_at", lastChangeAt);
  };

  if (!family) {
    await clearDirty();
    return { skipped: "no-family" };
  }

  const emails: string[] = (family.email ?? []).filter(
    (e: unknown): e is string => typeof e === "string" && e.includes("@"),
  );
  if (emails.length === 0) {
    await clearDirty();
    return { skipped: "no-email" };
  }

  const { data: guests } = await supabase
    .from("guests")
    .select("id, name")
    .eq("family_id", familyId)
    .order("id");

  const guestIds = (guests ?? []).map((g) => g.id);
  const nameById = new Map((guests ?? []).map((g) => [g.id, g.name as string]));

  const { data: rsvpRows } = await supabase
    .from("event_guests_rsvp")
    .select("guest_id, rsvp_status, events (id, name, date, time, location, dress_code)")
    .in("guest_id", guestIds.length ? guestIds : [-1])
    .order("event_id");

  const rows = (rsvpRows ?? []) as unknown as RsvpRow[];

  // Group RSVPs by event, preserving each guest's status.
  const byEvent = new Map<
    number,
    { event: EventRow; guests: { name: string; status: RsvpStatus }[] }
  >();
  for (const row of rows) {
    const event = row.events;
    if (!event) continue;
    let group = byEvent.get(event.id);
    if (!group) {
      group = { event, guests: [] };
      byEvent.set(event.id, group);
    }
    group.guests.push({
      name: nameById.get(row.guest_id) ?? "",
      status: row.rsvp_status,
    });
  }

  const events: EmailEvent[] = [...byEvent.values()]
    .sort(
      (a, b) =>
        new Date(`${a.event.date}T${(a.event.time ?? "00:00").slice(0, 5)}`).getTime() -
        new Date(`${b.event.date}T${(b.event.time ?? "00:00").slice(0, 5)}`).getTime(),
    )
    .map((g) => ({
      name: g.event.name,
      dateLabel: formatEventDate(g.event.date, g.event.time),
      location: g.event.location,
      dressCode: g.event.dress_code,
      guests: g.guests,
    }));

  const allStatuses = rows.map((r) => r.rsvp_status);
  const total = allStatuses.length;
  const answered = allStatuses.filter((s) => s !== "PENDING").length;

  const { subject, html } = renderRsvpConfirmationEmail({
    memberFirstNames: (guests ?? []).map((g) => firstName(g.name as string)),
    sideLabel: family.side === "BRIDE" ? "Sarrah's side" : "Murtaza's side",
    events,
    invitationUrl: `${SITE_URL}/invitation?family=${familyId}`,
    answered,
    total,
  });

  await sendEmail({ to: emails, subject, html });

  // Stamp last_sent_at unconditionally (enforces the cooldown), then clear
  // dirty only if no newer change arrived while we were sending. If one did,
  // the row stays dirty and re-sends after the cooldown with the newer state.
  const nowIso = new Date().toISOString();
  await supabase
    .from("rsvp_email_queue")
    .update({ last_sent_at: nowIso })
    .eq("family_id", familyId);
  const { data: cleared } = await supabase
    .from("rsvp_email_queue")
    .update({ dirty: false })
    .eq("family_id", familyId)
    .eq("last_change_at", lastChangeAt)
    .select("family_id");

  return {
    sent: emails.length,
    superseded: (cleared ?? []).length === 0,
  };
}

Deno.serve(async (req) => {
  // Only the cron job (bearer DISPATCH_SECRET) may trigger a run.
  if (DISPATCH_SECRET) {
    if (req.headers.get("Authorization") !== `Bearer ${DISPATCH_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const now = Date.now();
  const quietBefore = new Date(now - QUIET_MINUTES * 60_000).toISOString();
  const cooldownCutoff = now - COOLDOWN_MINUTES * 60_000;

  // Families whose latest change has settled past the quiet window.
  const { data: due, error } = await supabase
    .from("rsvp_email_queue")
    .select("family_id, last_change_at, last_sent_at")
    .eq("dirty", true)
    .lte("last_change_at", quietBefore);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Apply the per-family cooldown so bursts across sessions don't exceed one
  // email per COOLDOWN_MINUTES.
  const ready = (due ?? []).filter(
    (r) => !r.last_sent_at || new Date(r.last_sent_at).getTime() <= cooldownCutoff,
  );

  const results: Record<string, unknown>[] = [];
  for (const row of ready) {
    try {
      const outcome = await processFamily(supabase, row.family_id, row.last_change_at);
      results.push({ family_id: row.family_id, ...outcome });
    } catch (err) {
      results.push({ family_id: row.family_id, error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
