import type { ReactNode } from "react";

const VARIANT = {
  banner: "text-xs text-red-500 font-body border-l-2 border-red-300 pl-3 py-1",
  inline: "text-xs text-red-500 font-body",
  badge: "text-xs font-body text-red-500",
} as const;

type Variant = keyof typeof VARIANT;

export function ErrorMessage({
  children,
  variant = "banner",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p className={`${VARIANT[variant]} ${className ?? ""}`.trimEnd()}>
      {children}
    </p>
  );
}
