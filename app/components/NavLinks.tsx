"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/our-story", label: "Our Story" },
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
            className={`rounded-full px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs tracking-wider sm:tracking-widest uppercase whitespace-nowrap transition-colors duration-300 ${isActive
                ? "bg-blush text-rose font-medium"
                : "text-text-secondary hover:text-rose hover:bg-blush/50"
              }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
