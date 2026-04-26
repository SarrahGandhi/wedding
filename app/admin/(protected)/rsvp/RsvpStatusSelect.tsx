"use client";

import { useTransition, useState } from "react";
import { setRsvpStatus } from "./actions";

type Status = "PENDING" | "ACCEPTED" | "DECLINED";

const STATUS_DOT: Record<Status, string> = {
  PENDING: "bg-muted",
  ACCEPTED: "bg-sage",
  DECLINED: "bg-red-400",
};

export function RsvpStatusSelect({
  rsvpId,
  status,
}: {
  rsvpId: number;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<Status>(status);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.currentTarget.value as Status;
    setOptimistic(next);
    setError(null);
    const formData = new FormData();
    formData.append("rsvp_id", String(rsvpId));
    formData.append("status", next);
    startTransition(async () => {
      const result = await setRsvpStatus(formData);
      if (result.error) {
        setError(result.error);
        setOptimistic(status);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[optimistic]} transition-colors`}
        aria-hidden
      />
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
      {error && (
        <span className="text-[10px] font-body text-red-500">{error}</span>
      )}
    </div>
  );
}
