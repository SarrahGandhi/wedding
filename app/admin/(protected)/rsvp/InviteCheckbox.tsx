"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inviteGuestToEvent,
  uninviteGuestFromEvent,
  setRsvpStatus,
} from "./actions";
import type { RsvpStatus } from "@/lib/types";
import { useServerAction } from "@/app/shared/useServerAction";
import { StatusDot } from "@/app/shared/StatusDot";
import { ErrorMessage } from "@/app/shared/ErrorMessage";

const STATUS_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
];

export function InviteCheckbox({
  guestId,
  eventId,
  eventName,
  status: initialStatus,
  inviteAllSignal = 0,
}: {
  guestId: number;
  eventId: number;
  eventName: string;
  status: RsvpStatus | null;
  inviteAllSignal?: number;
}) {
  const router = useRouter();
  const invite = useServerAction(inviteGuestToEvent);
  const uninvite = useServerAction(uninviteGuestFromEvent);
  const updateStatus = useServerAction(setRsvpStatus);
  const [status, setStatus] = useState<RsvpStatus | null>(
    initialStatus ?? (inviteAllSignal > 0 ? "PENDING" : null),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const invited = status !== null;
  const pending = invite.pending || uninvite.pending || updateStatus.pending;
  const error = invite.error || uninvite.error || updateStatus.error;

  function makeFormData(extra?: Record<string, string>) {
    const formData = new FormData();
    formData.append("event_id", String(eventId));
    formData.append("guest_id", String(guestId));
    for (const [k, v] of Object.entries(extra ?? {})) formData.append(k, v);
    return formData;
  }

  function onToggleInvite(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.currentTarget.checked;
    const previous = status;
    setStatus(next ? "PENDING" : null);
    setMenuOpen(false);
    const action = next ? invite : uninvite;
    action.run(makeFormData(), {
      onSuccess: () => router.refresh(),
      onError: () => setStatus(previous),
    });
  }

  function onPickStatus(next: RsvpStatus) {
    setMenuOpen(false);
    if (next === status) return;
    const previous = status;
    setStatus(next);
    updateStatus.run(makeFormData({ status: next }), {
      onSuccess: () => router.refresh(),
      onError: () => setStatus(previous),
    });
  }

  return (
    <span
      className={`inline-flex items-center gap-2 ${pending ? "opacity-60" : ""}`}
    >
      <label className="inline-flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={invited}
          onChange={onToggleInvite}
          disabled={pending}
          className="accent-foreground w-4 h-4 cursor-pointer"
        />
        <span className="text-[11px] tracking-[0.2em] uppercase font-body text-foreground group-hover:text-accent transition-colors">
          {eventName}
        </span>
      </label>
      {invited && (
        <span className="relative inline-flex">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={pending}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Change RSVP status for ${eventName} (currently ${status?.toLowerCase()})`}
            title={`${status?.charAt(0)}${status?.slice(1).toLowerCase()} — click to change`}
            className="inline-flex items-center justify-center w-4 h-4 cursor-pointer hover:scale-125 transition-transform"
          >
            <StatusDot status={status ?? "PENDING"} />
          </button>
          {menuOpen && (
            <>
              <span
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <span
                role="menu"
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-20 flex flex-col bg-warm-white border border-border/60 shadow-sm min-w-max"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitem"
                    onClick={() => onPickStatus(opt.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase font-body text-left hover:bg-cream/60 transition-colors cursor-pointer ${
                      opt.value === status
                        ? "text-foreground"
                        : "text-text-secondary"
                    }`}
                  >
                    <StatusDot status={opt.value} />
                    {opt.label}
                  </button>
                ))}
              </span>
            </>
          )}
        </span>
      )}
      {error && <ErrorMessage variant="badge">{error}</ErrorMessage>}
    </span>
  );
}
