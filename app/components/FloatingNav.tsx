"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import logo from "@/public/logo.png";
import { NavLinks } from "./NavLinks";

export function FloatingNav() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      // Ignore sub-pixel jitter so the nav doesn't flicker
      if (Math.abs(delta) < 4) return;
      setHidden(delta > 0 && y > 96);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 transition-all duration-500 ease-out ${
        hidden
          ? "-translate-y-24 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      <nav className="w-fit mx-auto rounded-full bg-linear-to-r from-rose/55 via-bluebell/35 to-deepblue/30 p-[1.5px] shadow-[0_18px_48px_-16px_rgba(31,58,85,0.5)]">
        <div className="flex items-center gap-2 rounded-full border border-white/85 bg-warm-white/95 py-2.5 pl-3.5 pr-2.5 backdrop-blur-xl sm:gap-5 sm:pl-4.5 sm:pr-3">
          <Link
            href="/"
            className="shrink-0 transition-transform duration-300 hover:-rotate-6"
          >
            <Image
              src={logo}
              alt="Murtaza and Sarrah"
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>
          <NavLinks />
        </div>
      </nav>
    </header>
  );
}
