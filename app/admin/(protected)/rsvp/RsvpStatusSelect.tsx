"use client";

import { useState } from "react";
import { setRsvpStatus } from "./actions";
import type { RsvpStatus } from "@/lib/types";
import { useServerAction } from "@/app/shared/useServerAction";
import { StatusDot } from "@/app/shared/StatusDot";
import { ErrorMessage } from "@/app/shared/ErrorMessage";

export function RsvpStatusSelect({
  rsvpId,
  status,
}: {
  rsvpId: number;
  status: RsvpStatus;
}) {
  const { pending, error, run } = useServerAction(setRsvpStatus);
  const [optimistic, setOptimistic] = useState<RsvpStatus>(status);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.currentTarget.value as RsvpStatus;
    setOptimistic(next);
    const formData = new FormData();
    formData.append("rsvp_id", String(rsvpId));
    formData.append("status", next);
    run(formData, {
      onError: () => setOptimistic(status),
    });
  }

  return (
    <div className="flex items-center gap-3">
      <StatusDot status={optimistic} />
      <select
        value={optimistic}
        onChange={onChange}
        disabled={pending}
        className="bg-transparent border-b border-border/60 hover:border-accent/60 focus:border-accent focus:outline-none px-1 py-1 text-[11px] tracking-[0.25em] uppercase font-body text-foreground transition-colors cursor-pointer disabled:opacity-60"
      >
        <option value="PENDING">Pending</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="DECLINED">Declined</option>
      </select>
      {pending && (
        <span className="text-[10px] tracking-[0.25em] uppercase font-body text-muted">
          …
        </span>
      )}
      {error && <ErrorMessage variant="badge">{error}</ErrorMessage>}
    </div>
  );
}
