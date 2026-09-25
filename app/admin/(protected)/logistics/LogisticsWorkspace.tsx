"use client";

import { useState, useTransition } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { accommodationLabel, arrivalSortKey, arrivalSupportSummary, compareNames, familyArrivals, filterLogisticsFamilies, formatArrivalDateTime, groupArrivalsByTime, hasIncompleteArrival, needsArrivalSupport, sortLogisticsFamilies, travelSummary, type Accommodation, type AccommodationRequiredFilter, type LogisticsFamily, type LogisticsSideFilter, type LogisticsSort } from "@/lib/logistics";
import { LogisticsForm } from "./LogisticsForm";
import { DepartureWorkspace } from "./DepartureWorkspace";
import { setArrivalSupportRequired } from "./actions";

function FamilyRow({ family, accommodations, pickupNames, initiallyOpen }: {
  family: LogisticsFamily; accommodations: Accommodation[]; pickupNames: string[]; initiallyOpen: boolean;
}) {
  const required = needsArrivalSupport(family);
  const [editing, setEditing] = useState(initiallyOpen && required);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const arrivals = familyArrivals(family.logistics).sort((a, b) => compareNames(arrivalSortKey(a), arrivalSortKey(b)));
  return (
    <article id={`family-${family.id}`} className="border-t border-border/60 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl leading-tight">{family.label}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            <span className="tabular-nums">#{family.id}</span> · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"} · {family.guests.length} confirmed {family.guests.length === 1 ? "guest" : "guests"}
          </p>
        </div>
        {required && <Button variant="secondary" className="shrink-0" disabled={pending} aria-expanded={editing} aria-controls={`logistics-form-${family.id}`}
          onClick={() => { setSaved(false); setEditing(!editing); }}>
          {editing ? "Close" : family.logistics ? "Edit" : "Add details"}
        </Button>}
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={required} disabled={pending || editing}
          aria-label={`Pickup and accommodation required for ${family.label}`}
          className="h-5 w-5 shrink-0 accent-sage disabled:opacity-50"
          onChange={(event) => {
            const nextRequired = event.target.checked;
            const form = new FormData();
            form.set("family_id", String(family.id));
            form.set("required", String(nextRequired));
            setError(null);
            setNotice("");
            setSaved(false);
            startTransition(async () => {
              try {
                const result = await setArrivalSupportRequired(form);
                if (result.error) setError(result.error);
                else setNotice(nextRequired ? "Pickup and accommodation marked as required." : "Pickup and accommodation marked as not required.");
              } catch {
                setError("The change could not be confirmed. Refresh the page and try again.");
              }
            });
          }} />
        {pending ? "Saving…" : "Pickup and accommodation required"}
      </label>
      {editing && <p className="mt-2 text-sm text-text-secondary">Save or close the form to change this option.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-sage">{notice}</p>}
      {!required ? <p className="mt-4 text-sm text-text-secondary">Local family — pickup and accommodation not required.</p> : <>
      <dl className="mt-5 text-sm">
        <dt className="mb-1 text-text-secondary">Accommodation</dt><dd className="break-words">{family.accommodation ? accommodationLabel(family.accommodation) : "Not assigned yet"}</dd>
      </dl>
      {arrivals.length === 0 ? <p className="mt-5 text-sm text-text-secondary">No arrivals planned yet.</p> : <ul className="mt-5 space-y-4" aria-label={`Pickups for ${family.label}`}>
        {arrivals.map((entry, index) => <li key={index} className="rounded-xl border border-border/60 p-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="mb-1 text-text-secondary">Guests arriving</dt><dd className="break-words">{entry.guests || "Whole family"}</dd></div>
            <div><dt className="mb-1 text-text-secondary">Arriving</dt><dd className="tabular-nums">{formatArrivalDateTime(entry)}</dd></div>
            <div><dt className="mb-1 text-text-secondary">Travelling by</dt><dd>{travelSummary(entry)}</dd></div>
            <div><dt className="mb-1 text-text-secondary">To be picked up by</dt><dd className="break-words">{entry.pickup_by || "Not assigned yet"}</dd></div>
          </dl>
          {entry.travel_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{entry.travel_details}</p>}
        </li>)}
      </ul>}
      {saved && <p role="status" className="mt-3 text-sm text-sage">Logistics saved.</p>}
      <div id={`logistics-form-${family.id}`}>
        {editing && <LogisticsForm family={family} accommodations={accommodations} pickupNames={pickupNames}
          onSaved={() => { setEditing(false); setSaved(true); }} onCancel={() => setEditing(false)} />}
      </div>
      </>}
    </article>
  );
}

function ArrivalWorkspace({ families, accommodations, initialFamilyId }: {
  families: LogisticsFamily[]; accommodations: Accommodation[]; initialFamilyId: number | null;
}) {
  const [search, setSearch] = useState(initialFamilyId ? `#${initialFamilyId}` : "");
  const [filter, setFilter] = useState("ALL");
  const [side, setSide] = useState<LogisticsSideFilter>("ALL");
  const [required, setRequired] = useState<AccommodationRequiredFilter>("ALL");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [view, setView] = useState("family");
  const [sort, setSort] = useState<Extract<LogisticsSort, "family" | "arrival" | "pickup">>("family");
  const pickupNames = [...new Set(families.flatMap((family) => familyArrivals(family.logistics).flatMap((entry) => entry.pickup_by ? [entry.pickup_by] : [])))].sort(compareNames);
  const { assigned, awaiting, notRequired } = arrivalSupportSummary(families);
  const visible = sortLogisticsFamilies(filterLogisticsFamilies(families, { search, side, required }).filter((family) => {
    if (filter === "UNASSIGNED") return needsArrivalSupport(family) && !family.accommodation;
    if (filter === "TRAVEL") return hasIncompleteArrival(family);
    return true;
  }), sort);

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
        {families.length} confirmed {families.length === 1 ? "family" : "families"} · {assigned} with accommodation · {awaiting} awaiting accommodation · {notRequired} not requiring arrangements
      </p>
      <div className="mb-8 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FormField label="Search families or stays" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guest name, family #, hotel or house…" />
        <SelectField label="Side" value={side} onChange={(event) => setSide(event.target.value as LogisticsSideFilter)}>
          <option value="ALL">Both sides</option>
          <option value="BRIDE">Bride’s side</option>
          <option value="GROOM">Groom’s side</option>
        </SelectField>
        <SelectField label="Accommodation required" value={required} onChange={(event) => setRequired(event.target.value as AccommodationRequiredFilter)}>
          <option value="ALL">All families</option>
          <option value="REQUIRED">Required (checked)</option>
          <option value="NOT_REQUIRED">Not required (unchecked)</option>
        </SelectField>
        <SelectField label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="ALL">All confirmed families</option>
          <option value="UNASSIGNED">Awaiting accommodation</option>
          <option value="TRAVEL">Travel details incomplete</option>
        </SelectField>
        <SelectField label="View" value={view} onChange={(event) => setView(event.target.value)}>
          <option value="family">By family</option>
          <option value="time">Group by arrival date and time</option>
        </SelectField>
        <SelectField label="Sort by" value={view === "time" ? "arrival" : sort} disabled={view === "time"} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="family">Family name</option>
          <option value="arrival">Earliest arrival date and time</option>
          <option value="pickup">To be picked up by (A–Z)</option>
        </SelectField>
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Exports the families shown below, in the current order.</p>
        <Button variant="secondary" onClick={exportExcel} disabled={exporting || visible.length === 0} aria-busy={exporting}>
          {exporting ? "Exporting…" : "Export Excel"}
        </Button>
      </div>
      {exportError && <p role="alert" className="mb-6 text-sm text-rose">{exportError}</p>}
      <div hidden={view !== "family"}>
      {visible.length === 0 ? <p className="py-6 text-text-secondary">No families match these filters.</p> : visible.map((family) => (
        <FamilyRow key={family.id} family={family} accommodations={accommodations} pickupNames={pickupNames} initiallyOpen={family.id === initialFamilyId} />
      ))}
      </div>
      {view === "time" && <ArrivalTimeGroups families={visible} onViewFamily={(id) => { setView("family"); setSearch(`#${id}`); }} />}
    </>
  );
}

function ArrivalTimeGroups({ families, onViewFamily }: { families: LogisticsFamily[]; onViewFamily: (id: number) => void }) {
  const groups = groupArrivalsByTime(families);
  return <div className="space-y-7">
    <p className="text-sm text-text-secondary">Pickups with the same date and time appear together. All times are in India Standard Time (IST).</p>
    {groups.length === 0 ? <p className="py-6 text-text-secondary">No pickups to group. Switch to the family view to add arrival details.</p> : groups.map((group) => <section key={group.key} className="border-t border-border/60 pt-6">
      <h2 className="font-display text-2xl tabular-nums">{group.label}</h2>
      <p className="mt-2 text-sm text-text-secondary">{group.entries.length} {group.entries.length === 1 ? "pickup" : "pickups"}</p>
      <ul className="mt-4 space-y-3">
        {group.entries.map(({ family, arrival, index }) => <li key={`${family.id}-${index}`} className="rounded-xl border border-border/60 bg-warm-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-medium">{family.label}</h3>
              <p className="mt-1 break-words text-sm text-text-secondary">{arrival.guests || "Whole family"} · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"}</p>
            </div>
            <Button variant="secondary" className="shrink-0" onClick={() => onViewFamily(family.id)} aria-label={`View ${family.label}`}>View family</Button>
          </div>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="mb-1 text-text-secondary">Travelling by</dt><dd>{travelSummary(arrival)}</dd></div>
            <div><dt className="mb-1 text-text-secondary">To be picked up by</dt><dd className="break-words">{arrival.pickup_by || "Not assigned yet"}</dd></div>
          </dl>
          {arrival.travel_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{arrival.travel_details}</p>}
        </li>)}
      </ul>
    </section>)}
  </div>;
}

export function LogisticsWorkspace(props: {
  families: LogisticsFamily[]; accommodations: Accommodation[]; initialFamilyId: number | null;
}) {
  const [tab, setTab] = useState<"arrival" | "departure">("arrival");
  return <>
    <div className="mb-7 inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1.5" role="tablist" aria-label="Travel direction">
      {(["arrival", "departure"] as const).map((value) => <button key={value} type="button" role="tab"
        id={`logistics-tab-${value}`} aria-controls={`logistics-panel-${value}`} aria-selected={tab === value}
        tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "arrival" : event.key === "End" ? "departure" : value === "arrival" ? "departure" : "arrival";
          setTab(next);
          document.getElementById(`logistics-tab-${next}`)?.focus();
        }}
        className={`cursor-pointer rounded-xl px-5 py-3 text-base font-medium transition-colors ${tab === value
          ? "bg-foreground text-warm-white" : "text-text-secondary hover:bg-powder"}`}>
        {value === "arrival" ? "Arrival" : "Departure"}
      </button>)}
    </div>
    <div role="tabpanel" id="logistics-panel-arrival" aria-labelledby="logistics-tab-arrival" hidden={tab !== "arrival"}>
      <ArrivalWorkspace {...props} />
    </div>
    <div role="tabpanel" id="logistics-panel-departure" aria-labelledby="logistics-tab-departure" hidden={tab !== "departure"}>
      <DepartureWorkspace families={props.families} initialFamilyId={props.initialFamilyId} />
    </div>
  </>;
}
