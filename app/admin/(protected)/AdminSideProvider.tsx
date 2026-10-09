"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SideFilter } from "@/lib/types";

const AdminSideContext = createContext<{
  side: SideFilter;
  setSide: (side: SideFilter) => void;
} | null>(null);

export function AdminSideProvider({ initialSide, children }: {
  initialSide: SideFilter;
  children: ReactNode;
}) {
  const [side, updateSide] = useState(initialSide);

  function setSide(next: SideFilter) {
    updateSide(next);
    document.cookie = `admin-side=${next}; Path=/admin; Max-Age=31536000; SameSite=Lax`;
  }

  return <AdminSideContext.Provider value={{ side, setSide }}>{children}</AdminSideContext.Provider>;
}

export function useAdminSide() {
  const context = useContext(AdminSideContext);
  if (!context) throw new Error("useAdminSide requires AdminSideProvider");
  return context;
}

export function AdminSideToggle() {
  const { side, setSide } = useAdminSide();
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-6 pb-4 font-body">
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1" role="group" aria-label="Side for all filtered pages">
        {([['ALL', 'Both sides'], ['BRIDE', 'Bride’s side'], ['GROOM', 'Groom’s side']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={side === value} onClick={() => setSide(value)}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${side === value
              ? value === "BRIDE" ? "bg-blush text-rose" : value === "GROOM" ? "bg-sky text-bluebell" : "bg-foreground text-warm-white"
              : "text-text-secondary hover:bg-powder"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-sm text-text-secondary">Applies to Roster, RSVP, Tasks, Shopping, Logistics, Accommodation, and Budgeting.</p>
    </div>
  );
}
