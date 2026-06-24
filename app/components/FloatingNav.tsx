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
      className={`fixed top-3 left-0 right-0 z-50 px-3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:top-4 ${
        hidden
          ? "-translate-y-24 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      <nav className="mx-auto w-fit rounded-full border border-white/70 bg-warm-white/55 p-1 shadow-[0_16px_38px_-26px_rgba(90,80,90,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-full bg-warm-white/35 py-2 pl-3 pr-2 sm:gap-5 sm:pl-4 sm:pr-2.5">
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
