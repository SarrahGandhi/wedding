"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/guests", label: "Roster" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/rsvp", label: "RSVP" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-7 gap-y-2">
      {links.map(({ href, label }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`text-[11px] tracking-[0.28em] uppercase font-body transition-colors ${
              isActive
                ? "text-accent font-display italic tracking-[0.18em] text-base normal-case"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
