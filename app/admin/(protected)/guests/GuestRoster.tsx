"use client";

import { useState } from "react";
import { FamilySection } from "./FamilySection";
import type { GuestCategory, GuestSide } from "@/lib/types";

type Family = {
  id: number;
  side: GuestSide;
  email: string[];
  phone: string | null;
};

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
};

type FamilyWithGuests = {
  family: Family;
  guests: Guest[];
  label: string;
};

function matchesSearch(entry: FamilyWithGuests, query: string): boolean {
  const q = query.toLowerCase();
  if (entry.label.toLowerCase().includes(q)) return true;
  if (String(entry.family.id).includes(q)) return true;
  if (entry.family.phone?.toLowerCase().includes(q)) return true;
  if (entry.family.email.some((e) => e.toLowerCase().includes(q))) return true;
  return false;
}

export function GuestRoster({
  brideFamilies,
  groomFamilies,
}: {
  brideFamilies: FamilyWithGuests[];
  groomFamilies: FamilyWithGuests[];
}) {
  const [search, setSearch] = useState("");

  const filteredBride = search
    ? brideFamilies.filter((f) => matchesSearch(f, search))
    : brideFamilies;
  const filteredGroom = search
    ? groomFamilies.filter((f) => matchesSearch(f, search))
    : groomFamilies;

  const noResults =
    search && filteredBride.length === 0 && filteredGroom.length === 0;

  return (
    <>
      <div className="mb-10">
        <label className="block">
          <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1 block">
            Search families
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, phone, or family #…"
            className="w-full max-w-md bg-warm-white border border-border/60 px-4 py-2.5 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors placeholder:text-muted/60"
          />
        </label>
      </div>

      {noResults ? (
        <p className="text-sm text-muted italic font-body">
          No families match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <>
          {filteredBride.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Bride&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {filteredBride.map((f) => (
                <FamilySection
                  key={f.family.id}
                  family={f.family}
                  guests={f.guests}
                  label={f.label}
                />
              ))}
            </section>
          )}

          {filteredGroom.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Groom&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {filteredGroom.map((f) => (
                <FamilySection
                  key={f.family.id}
                  family={f.family}
                  guests={f.guests}
                  label={f.label}
                />
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
