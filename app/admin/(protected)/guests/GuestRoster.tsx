"use client";

import { useState } from "react";
import { FamilySection } from "./FamilySection";
import type { GuestCategory, GuestSide } from "@/lib/types";
import { Button } from "@/app/shared/Button";

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

type SideFilter = "ALL" | GuestSide;

function guestCountFor(families: FamilyWithGuests[]): number {
  return families.reduce((total, entry) => total + entry.guests.length, 0);
}

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
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [openFamilyIds, setOpenFamilyIds] = useState<Set<number>>(new Set());
  const brideGuestCount = guestCountFor(brideFamilies);
  const groomGuestCount = guestCountFor(groomFamilies);

  const filteredBride = search
    ? brideFamilies.filter((f) => matchesSearch(f, search))
    : brideFamilies;
  const filteredGroom = search
    ? groomFamilies.filter((f) => matchesSearch(f, search))
    : groomFamilies;
  const visibleBride = sideFilter === "GROOM" ? [] : filteredBride;
  const visibleGroom = sideFilter === "BRIDE" ? [] : filteredGroom;
  const visibleFamilies = [...visibleBride, ...visibleGroom];
  const allVisibleOpen =
    visibleFamilies.length > 0 &&
    visibleFamilies.every((f) => openFamilyIds.has(f.family.id));

  const noResults =
    visibleFamilies.length === 0 &&
    (Boolean(search) || brideFamilies.length > 0 || groomFamilies.length > 0);

  function setFamilyExpanded(familyId: number, expanded: boolean) {
    setOpenFamilyIds((current) => {
      const next = new Set(current);
      if (expanded) {
        next.add(familyId);
      } else {
        next.delete(familyId);
      }
      return next;
    });
  }

  function toggleAllVisibleFamilies() {
    setOpenFamilyIds((current) => {
      const next = new Set(current);
      if (allVisibleOpen) {
        for (const entry of visibleFamilies) {
          next.delete(entry.family.id);
        }
      } else {
        for (const entry of visibleFamilies) {
          next.add(entry.family.id);
        }
      }
      return next;
    });
  }

  return (
    <>
      <div className="mb-10 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              label: "Bride's side",
              familyCount: brideFamilies.length,
              guestCount: brideGuestCount,
            },
            {
              label: "Groom's side",
              familyCount: groomFamilies.length,
              guestCount: groomGuestCount,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-warm-white border border-border/50 px-4 py-3"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-2">
                {stat.label}
              </p>
              <p className="font-body text-sm text-foreground">
                <span className="tabular-nums">{stat.familyCount}</span>{" "}
                {stat.familyCount === 1 ? "family" : "families"} ·{" "}
                <span className="tabular-nums">{stat.guestCount}</span>{" "}
                {stat.guestCount === 1 ? "guest" : "guests"}
              </p>
            </div>
          ))}
        </div>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-2">
              Side
            </p>
            <div className="inline-flex flex-wrap gap-2">
              {[
                ["ALL", "All families"],
                ["BRIDE", "Bride's side"],
                ["GROOM", "Groom's side"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={sideFilter === value ? "primary" : "secondary"}
                  onClick={() => setSideFilter(value as SideFilter)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={toggleAllVisibleFamilies}
            disabled={visibleFamilies.length === 0}
          >
            {allVisibleOpen
              ? "Close all dropdowns for families"
              : "Open all dropdowns for families"}
          </Button>
        </div>
      </div>

      {noResults ? (
        <p className="text-sm text-muted italic font-body">
          {search ? (
            <>
              No families match &ldquo;{search}&rdquo;
            </>
          ) : (
            "No families match this side filter"
          )}
        </p>
      ) : (
        <>
          {visibleBride.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Bride&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {visibleBride.map((f) => (
                <FamilySection
                  key={f.family.id}
                  family={f.family}
                  guests={f.guests}
                  label={f.label}
                  expanded={openFamilyIds.has(f.family.id)}
                  onExpandedChange={(expanded) =>
                    setFamilyExpanded(f.family.id, expanded)
                  }
                />
              ))}
            </section>
          )}

          {visibleGroom.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Groom&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {visibleGroom.map((f) => (
                <FamilySection
                  key={f.family.id}
                  family={f.family}
                  guests={f.guests}
                  label={f.label}
                  expanded={openFamilyIds.has(f.family.id)}
                  onExpandedChange={(expanded) =>
                    setFamilyExpanded(f.family.id, expanded)
                  }
                />
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
