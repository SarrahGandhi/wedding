"use client";

import { useState } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { accommodationLabel, compareNames, formatArrival, matchesFamily, travelSummary, type Accommodation, type LogisticsFamily } from "@/lib/logistics";
import { LogisticsForm } from "./LogisticsForm";

function FamilyRow({ family, accommodations, initiallyOpen }: {
  family: LogisticsFamily; accommodations: Accommodation[]; initiallyOpen: boolean;
}) {
  const [editing, setEditing] = useState(initiallyOpen);
  const [saved, setSaved] = useState(false);
  return (
    <article id={`family-${family.id}`} className="border-t border-border/60 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl leading-tight">{family.label}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            <span className="tabular-nums">#{family.id}</span> · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"} · {family.guests.length} confirmed {family.guests.length === 1 ? "guest" : "guests"}
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" aria-expanded={editing} aria-controls={`logistics-form-${family.id}`}
          onClick={() => { setSaved(false); setEditing(!editing); }}>
          {editing ? "Close" : family.logistics ? "Edit" : "Add details"}
        </Button>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <div><dt className="mb-1 text-text-secondary">Travelling by</dt><dd className="break-words">{travelSummary(family.logistics)}</dd></div>
        <div><dt className="mb-1 text-text-secondary">Arriving</dt><dd className="tabular-nums">{formatArrival(family.logistics?.arrival_date)}</dd></div>
        <div><dt className="mb-1 text-text-secondary">Accommodation</dt><dd className="break-words">{family.accommodation ? accommodationLabel(family.accommodation) : "Not assigned yet"}</dd></div>
      </dl>
      {family.logistics?.travel_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{family.logistics.travel_details}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-sage">Logistics saved.</p>}
      <div id={`logistics-form-${family.id}`}>
        {editing && <LogisticsForm family={family} accommodations={accommodations}
          onSaved={() => { setEditing(false); setSaved(true); }} onCancel={() => setEditing(false)} />}
      </div>
    </article>
  );
}

export function LogisticsWorkspace({ families, accommodations, initialFamilyId }: {
  families: LogisticsFamily[]; accommodations: Accommodation[]; initialFamilyId: number | null;
}) {
  const [search, setSearch] = useState(initialFamilyId ? `#${initialFamilyId}` : "");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("family");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const assigned = families.filter((family) => family.accommodation).length;
  const visible = families.filter((family) => {
    const exactId = /^#(\d+)$/.exec(search.trim());
    if (exactId ? family.id !== Number(exactId[1]) : !matchesFamily(family, search)) return false;
    if (filter === "UNASSIGNED") return !family.accommodation;
    if (filter === "TRAVEL") return !family.logistics?.travel_mode || !family.logistics?.arrival_date;
    if (filter === "BRIDE" || filter === "GROOM") return family.side === filter;
    return true;
  }).sort((a, b) => (sort === "arrival"
    ? compareNames(a.logistics?.arrival_date ?? "9999", b.logistics?.arrival_date ?? "9999") : 0) || compareNames(a.label, b.label));

  async function exportExcel() {
    setExporting(true);
    setExportError(null);
    try {
      const { downloadLogisticsExport } = await import("@/lib/logistics-export");
      await downloadLogisticsExport(visible);
    } catch {
      setExportError("The Excel file could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  if (families.length === 0) return <p className="py-6 text-text-secondary">Confirmed families will appear here when a guest accepts an invitation.</p>;

  return (
    <>
      <p className="mb-6 text-sm text-text-secondary tabular-nums">
        {families.length} confirmed {families.length === 1 ? "family" : "families"} · {assigned} with accommodation · {families.length - assigned} awaiting accommodation
      </p>
      <div className="mb-5 grid items-end gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <FormField label="Search families or stays" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guest name, family #, hotel or house…" />
        <SelectField label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="ALL">All confirmed families</option>
          <option value="UNASSIGNED">Awaiting accommodation</option>
          <option value="TRAVEL">Travel details incomplete</option>
          <option value="BRIDE">Bride’s side</option>
          <option value="GROOM">Groom’s side</option>
        </SelectField>
        <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="family">Family name</option>
          <option value="arrival">Arrival date</option>
        </SelectField>
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Exports the families shown below, in the current order.</p>
        <Button variant="secondary" onClick={exportExcel} disabled={exporting || visible.length === 0} aria-busy={exporting}>
          {exporting ? "Exporting…" : "Export Excel"}
        </Button>
      </div>
      {exportError && <p role="alert" className="mb-6 text-sm text-rose">{exportError}</p>}
      {visible.length === 0 ? <p className="py-6 text-text-secondary">No families match these filters.</p> : visible.map((family) => (
        <FamilyRow key={family.id} family={family} accommodations={accommodations} initiallyOpen={family.id === initialFamilyId} />
      ))}
    </>
  );
}
