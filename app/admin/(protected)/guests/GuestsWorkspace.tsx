"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import {
  AddFamilyForm,
  CreatedFamilyLinks,
  type CreatedFamily,
} from "./AddFamilyForm";
import { GuestRoster, type FamilyWithGuests } from "./GuestRoster";
import type { SideFilter } from "@/lib/types";
import { Button } from "@/app/shared/Button";

export function GuestsWorkspace({
  brideFamilies,
  groomFamilies,
}: {
  brideFamilies: FamilyWithGuests[];
  groomFamilies: FamilyWithGuests[];
}) {
  const [formOpen, setFormOpen] = useState(true);
  const [focusNonce, setFocusNonce] = useState(0);
  const [created, setCreated] = useState<CreatedFamily[]>([]);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [openFamilyIds, setOpenFamilyIds] = useState<Set<number>>(new Set());
  // Only ever set from the IntersectionObserver callback, so a truthy value
  // also guarantees we are client-side and `document.body` exists.
  const [showFab, setShowFab] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLLabelElement>(null);
  const createdRef = useRef<HTMLParagraphElement>(null);

  const isEmpty = brideFamilies.length === 0 && groomFamilies.length === 0;
  const createdCount = created.length;

  // Centred rather than top-aligned: on a short viewport the thing being
  // scrolled to is the point, and `start` leaves it flush against the top edge
  // where it reads as "the page just moved", not "look here".
  function centerInView(el: HTMLElement | null) {
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Creating a family adds a row to the "Created this session" list, which on
  // small screens lands below the fold — the form looked like it did nothing.
  useEffect(() => {
    if (createdCount === 0) return;
    centerInView(createdRef.current);
  }, [createdCount]);

  // The floating button only earns its place once the form is off-screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function onCreated(family: CreatedFamily) {
    setCreated((current) => [family, ...current]);
    // A lingering "#41" from an earlier jump would hide what was just created.
    setSearch("");
  }

  function jumpToFamily(id: number) {
    setSearch(`#${id}`);
    // An opposing side filter would otherwise swallow the jump entirely.
    setSideFilter("ALL");
    setOpenFamilyIds((current) => new Set(current).add(id));
    // Always travel, even if the roster is already partly on screen: the search
    // box is what proves the jump happened ("Exact match · family #42"), and the
    // lone result sits directly under it. Centring the box puts both in view.
    requestAnimationFrame(() => {
      centerInView(searchRef.current ?? rosterRef.current);
    });
  }

  function openFormFromFab() {
    setFormOpen(true);
    setFocusNonce((n) => n + 1);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section
        ref={sectionRef}
        className="mb-12 border-t border-b border-border/40 py-6"
      >
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body">
            New family
          </p>
          <Button
            variant="ghost"
            aria-expanded={formOpen}
            aria-controls="new-family-form"
            onClick={() => setFormOpen((v) => !v)}
          >
            {formOpen ? "Hide form" : "+ New family"}
          </Button>
        </div>
        {formOpen && (
          <p className="text-xs text-text-secondary font-body italic mb-5 leading-relaxed">
            Add the family and everyone in it in one go. Emails are optional —
            guests can fill them in themselves later.
          </p>
        )}
        <div id="new-family-form">
          <AddFamilyForm
            open={formOpen}
            onCreated={onCreated}
            focusNonce={focusNonce}
          />
        </div>
        <CreatedFamilyLinks
          created={created}
          onJump={jumpToFamily}
          headingRef={createdRef}
        />
      </section>

      <div ref={rosterRef}>
        {isEmpty ? (
          <p className="text-sm text-text-secondary font-body italic">
            No families yet — start by adding one above.
          </p>
        ) : (
          <GuestRoster
            brideFamilies={brideFamilies}
            groomFamilies={groomFamilies}
            search={search}
            onSearchChange={setSearch}
            searchRef={searchRef}
            sideFilter={sideFilter}
            onSideFilterChange={setSideFilter}
            openFamilyIds={openFamilyIds}
            onOpenFamilyIdsChange={setOpenFamilyIds}
          />
        )}
      </div>

      {/* Portalled out of the page: the `.animate-fade-up` wrapper keeps a
          transform (fill-mode `both`), which would otherwise make it the
          containing block for this fixed button and strand it at page bottom.
          The target is the admin shell rather than <body> — the shell is an
          opaque `fixed inset-0 z-[100]` layer, so a body-level portal would
          render correctly but sit underneath it. Being `fixed` (no transform),
          the shell is not a containing block for the button, which therefore
          stays pinned to the viewport as the shell scrolls. */}
      {showFab &&
        createPortal(
          <button
            type="button"
            onClick={openFormFromFab}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body shadow-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            New family
          </button>,
          document.getElementById("admin-shell") ?? document.body,
        )}
    </>
  );
}
