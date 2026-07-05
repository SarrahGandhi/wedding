// Renders the RSVP confirmation email. The look mirrors the invitation /
// RSVP page (same wedding-stationery palette, serif display headings, pastel
// event cards, status pills) but built with email-safe, table-based HTML and
// inline styles so it renders consistently across mail clients.

export type RsvpStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface EmailEventGuest {
  name: string;
  status: RsvpStatus;
}

export interface EmailEvent {
  name: string;
  dateLabel: string;
  location: string | null;
  dressCode: string | null;
  guests: EmailEventGuest[];
}

export interface RsvpEmailData {
  memberFirstNames: string[];
  sideLabel: string;
  events: EmailEvent[];
  invitationUrl: string;
  answered: number;
  total: number;
}

// Palette tokens lifted from app/globals.css.
const C = {
  bg: "#f8f1e6",
  warmWhite: "#fffaf3",
  powder: "#f3eee7",
  foreground: "#223149",
  textSecondary: "#6b625b",
  border: "#e5cfaa",
  rose: "#8f3f48",
  leaf: "#6f634d",
  bluebell: "#344f73",
  deepblue: "#223f63",
  tangerine: "#9d7443",
  blush: "#f0dcd4",
  mint: "#e9e3d8",
  sky: "#e5ebef",
  peach: "#ead7b7",
  white: "#ffffff",
};

// Solid pastel backdrop per event card, cycled like the page's gradients.
const CARD_TINTS = [C.blush, C.sky, C.powder];

const SERIF =
  "Georgia, 'Times New Roman', 'Iowan Old Style', 'Palatino Linotype', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return "there";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} &amp; ${names[names.length - 1]}`;
}

function statusPill(status: RsvpStatus): string {
  const map: Record<RsvpStatus, { label: string; bg: string; fg: string }> = {
    ACCEPTED: { label: "Attending", bg: C.mint, fg: C.leaf },
    DECLINED: { label: "Can't make it", bg: C.powder, fg: C.textSecondary },
    PENDING: { label: "Awaiting reply", bg: C.blush, fg: C.rose },
  };
  const s = map[status];
  return (
    `<span style="display:inline-block;font-family:${SANS};font-size:11px;` +
    `letter-spacing:1.5px;text-transform:uppercase;color:${s.fg};` +
    `background:${s.bg};border-radius:999px;padding:6px 14px;` +
    `white-space:nowrap;">${s.label}</span>`
  );
}

function guestRow(guest: EmailEventGuest, isLast: boolean): string {
  const border = isLast ? "" : `border-bottom:1px solid rgba(255,255,255,0.7);`;
  return (
    `<tr>` +
    `<td style="padding:12px 0;${border}font-family:${SERIF};font-size:18px;` +
    `color:${C.foreground};">${escapeHtml(guest.name)}</td>` +
    `<td align="right" style="padding:12px 0;${border}">` +
    `${statusPill(guest.status)}</td>` +
    `</tr>`
  );
}

function metaChip(label: string): string {
  return (
    `<span style="display:inline-block;font-family:${SANS};font-size:12px;` +
    `color:${C.textSecondary};background:${C.white};border-radius:999px;` +
    `padding:6px 12px;margin:0 6px 6px 0;">${escapeHtml(label)}</span>`
  );
}

function eventCard(event: EmailEvent, index: number): string {
  const tint = CARD_TINTS[index % CARD_TINTS.length];
  const chips = [event.location, event.dressCode]
    .filter((v): v is string => Boolean(v))
    .map(metaChip)
    .join("");

  const rows = event.guests
    .map((g, i) => guestRow(g, i === event.guests.length - 1))
    .join("");

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ` +
    `style="margin:0 0 20px 0;background:${tint};border-radius:22px;">` +
    `<tr><td style="padding:26px 28px 24px 28px;">` +
    // number + date
    `<div style="font-family:${SERIF};font-style:italic;font-size:30px;` +
    `color:${C.tangerine};line-height:1;margin:0 0 10px 0;">${index + 1}</div>` +
    `<div style="font-family:${SANS};font-size:11px;letter-spacing:2px;` +
    `text-transform:uppercase;color:${C.bluebell};margin:0 0 6px 0;">` +
    `${escapeHtml(event.dateLabel)}</div>` +
    `<div style="font-family:${SERIF};font-size:26px;color:${C.foreground};` +
    `margin:0 0 ${chips ? "14px" : "18px"} 0;">${escapeHtml(event.name)}</div>` +
    (chips ? `<div style="margin:0 0 16px 0;">${chips}</div>` : "") +
    // guests
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    rows +
    `</table>` +
    `</td></tr></table>`
  );
}

function progressLine(answered: number, total: number): string {
  const text =
    total > 0 && answered === total
      ? "All replies are in — we can't wait to celebrate with you."
      : `${answered} of ${total} ${total === 1 ? "reply" : "replies"} in so far.`;
  return (
    `<div style="font-family:${SANS};font-size:13px;letter-spacing:1px;` +
    `text-transform:uppercase;color:${C.textSecondary};text-align:center;` +
    `margin:0 0 26px 0;">${text}</div>`
  );
}

export function renderRsvpConfirmationEmail(data: RsvpEmailData): {
  subject: string;
  html: string;
} {
  const names = formatNameList(data.memberFirstNames);
  const cards = data.events.map((e, i) => eventCard(e, i)).join("");
  const url = escapeHtml(data.invitationUrl);

  const subject = "We've got your RSVP — Murtaza & Sarrah";

  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="color-scheme" content="light">` +
    `<title>${escapeHtml(subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.bg};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ` +
    `style="background:${C.bg};padding:32px 16px;">` +
    `<tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" ` +
    `style="width:100%;max-width:600px;background:${C.warmWhite};` +
    `border:1px solid ${C.border};border-radius:28px;overflow:hidden;">` +

    // ── Header ──
    `<tr><td style="padding:40px 36px 8px 36px;text-align:center;">` +
    `<div style="font-family:${SANS};font-size:11px;letter-spacing:4px;` +
    `text-transform:uppercase;color:${C.textSecondary};margin:0 0 14px 0;">` +
    `RSVP Confirmation · ${escapeHtml(data.sideLabel)}</div>` +
    `<div style="font-family:${SERIF};font-size:34px;color:${C.foreground};` +
    `line-height:1.2;">We&rsquo;ve got your reply,</div>` +
    `<div style="font-family:${SERIF};font-style:italic;font-size:34px;` +
    `color:${C.rose};line-height:1.2;margin:2px 0 0 0;">${names}</div>` +
    `</td></tr>` +

    // ── Intro ──
    `<tr><td style="padding:18px 36px 26px 36px;text-align:center;">` +
    `<div style="font-family:${SANS};font-size:15px;line-height:1.6;` +
    `color:${C.textSecondary};max-width:420px;margin:0 auto;">` +
    `Here&rsquo;s where your invitation stands right now. Changed your mind ` +
    `or need to update someone? You can adjust it any time.</div>` +
    `</td></tr>` +

    // ── Body ──
    `<tr><td style="padding:0 28px 8px 28px;">` +
    progressLine(data.answered, data.total) +
    cards +
    `</td></tr>` +

    // ── CTA ──
    `<tr><td style="padding:14px 36px 40px 36px;text-align:center;">` +
    `<a href="${url}" style="display:inline-block;font-family:${SANS};` +
    `font-size:13px;letter-spacing:2px;text-transform:uppercase;` +
    `color:${C.warmWhite};background:${C.deepblue};text-decoration:none;` +
    `border-radius:999px;padding:16px 34px;">View or update your RSVP</a>` +
    `</td></tr>` +

    // ── Footer ──
    `<tr><td style="padding:26px 36px 34px 36px;border-top:1px solid ` +
    `${C.border};text-align:center;">` +
    `<div style="font-family:${SERIF};font-style:italic;font-size:18px;` +
    `color:${C.rose};margin:0 0 6px 0;">Murtaza &amp; Sarrah</div>` +
    `<div style="font-family:${SANS};font-size:12px;color:${C.textSecondary};` +
    `line-height:1.6;">With love — we can&rsquo;t wait to celebrate with you.<br>` +
    `If this wasn&rsquo;t you, just reply to this email and let us know.</div>` +
    `</td></tr>` +

    `</table></td></tr></table></body></html>`;

  return { subject, html };
}
