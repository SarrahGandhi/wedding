"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/our-story", label: "Our Story" },
  { href: "/gallery", label: "Gallery" },
  { href: "/invitation", label: "RSVP" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {links.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3 py-2 text-[10px] font-medium sm:px-4 sm:text-[11px] tracking-[0.18em] sm:tracking-[0.28em] uppercase whitespace-nowrap transition-all duration-300 ${isActive
                ? "bg-deepblue text-warm-white shadow-[0_10px_22px_-14px_var(--deepblue)]"
                : "text-foreground hover:-translate-y-0.5 hover:bg-peach/75 hover:text-deepblue"
              }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
