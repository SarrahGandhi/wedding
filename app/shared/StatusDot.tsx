import type { RsvpStatus } from "@/lib/types";

const STATUS_DOT: Record<RsvpStatus, string> = {
  PENDING: "bg-muted",
  ACCEPTED: "bg-sage",
  DECLINED: "bg-red-400",
};

export function StatusDot({
  status,
  className,
}: {
  status: RsvpStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]} transition-colors ${className ?? ""}`.trimEnd()}
      aria-hidden
    />
  );
}
