"use client";

import { useState, type Dispatch, type Ref, type SetStateAction } from "react";
import type { IFuseOptions } from "fuse.js";
import { FamilySection } from "./FamilySection";
import type { GuestCategory, GuestSide, SideFilter } from "@/lib/types";
import { useFuzzyFilter } from "@/lib/useFuzzyFilter";
import { Button } from "@/app/shared/Button";
import {
  DEFAULT_FUZZINESS,
  FuzzinessControl,
} from "@/app/shared/FuzzinessControl";

type Family = {
  id: number;
  side: GuestSide;
  email: string[];
  phone: string | null;
  family_name: string | null;
  male_guest_slots: number;
  female_guest_slots: number;
  allow_all_guests: boolean;
};

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
  added_by_family: boolean;
};

export type FamilyWithGuests = {
  family: Family;
  guests: Guest[];
  label: string;
};

// A leading "#" means "this exact family id" and bypasses fuzzy matching —
// otherwise "42" also scores hits on #142, #420 and phone numbers.
function parseFamilyIdQuery(search: string): number | null {
  const match = search.trim().match(/^#(\d+)$/);
  return match ? Number(match[1]) : null;
}

const searchOptions: IFuseOptions<FamilyWithGuests> = {
  ignoreLocation: true,
  keys: [
    { name: "label", weight: 2 },
    { name: "guestNames", getFn: (entry) => entry.guests.map((g) => g.name) },
    { name: "familyId", getFn: (entry) => String(entry.family.id) },
    { name: "phone", getFn: (entry) => entry.family.phone ?? "" },
    { name: "family.email" },
  ],
};

export function GuestRoster({
  brideFamilies,
  groomFamilies,
  search,
  onSearchChange,
  searchRef,
  sideFilter,
  onSideFilterChange,
  openFamilyIds,
  onOpenFamilyIdsChange,
}: {
  brideFamilies: FamilyWithGuests[];
  groomFamilies: FamilyWithGuests[];
  search: string;
  onSearchChange: (search: string) => void;
  // The workspace scrolls to this after a "Jump to it", so the filtered-down
  // search and its lone result land together on small screens.
  searchRef?: Ref<HTMLLabelElement>;
  sideFilter: SideFilter;
  onSideFilterChange: (filter: SideFilter) => void;
  openFamilyIds: Set<number>;
  onOpenFamilyIdsChange: Dispatch<SetStateAction<Set<number>>>;
}) {
  const [fuzziness, setFuzziness] = useState(DEFAULT_FUZZINESS);

  const exactId = parseFamilyIdQuery(search);
  const fuzzySearch = exactId === null ? search : "";

  const fuzzyBride = useFuzzyFilter(
    brideFamilies,
    fuzzySearch,
    searchOptions,
    fuzziness,
  );
  const fuzzyGroom = useFuzzyFilter(
    groomFamilies,
    fuzzySearch,
    searchOptions,
    fuzziness,
  );
  const filteredBride =
    exactId === null
      ? fuzzyBride
      : brideFamilies.filter((f) => f.family.id === exactId);
  const filteredGroom =
    exactId === null
      ? fuzzyGroom
      : groomFamilies.filter((f) => f.family.id === exactId);

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
    onOpenFamilyIdsChange((current) => {
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
    onOpenFamilyIdsChange((current) => {
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
        <label ref={searchRef} className="block">
          <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1 block">
            Search families
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, email, phone, or #42 for an exact family…"
            className="w-full max-w-md bg-warm-white border border-border/60 px-4 py-2.5 font-body text-base sm:text-sm focus:outline-none focus:border-accent/60 transition-colors placeholder:text-muted/60"
          />
        </label>
        {exactId === null ? (
          <FuzzinessControl value={fuzziness} onChange={setFuzziness} />
        ) : (
          <p className="flex items-center gap-3 text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary">
            <span>
              Exact match · family{" "}
              <span className="tabular-nums text-accent">#{exactId}</span>
            </span>
            <Button variant="ghost" onClick={() => onSearchChange("")}>
              Clear
            </Button>
          </p>
        )}
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
                  onClick={() => onSideFilterChange(value as SideFilter)}
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
          {exactId !== null ? (
            <>No family with id #{exactId}</>
          ) : search ? (
            <>No families match &ldquo;{search}&rdquo;</>
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
