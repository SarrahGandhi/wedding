"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock3, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/app/shared/PageHeader";
import { flowCategories, flowSides, sideLabels, compareFlowEntries, type FlowCategory, type FlowSide, type FlowEntry, type FlowEvent } from "@/lib/wedding-flow";
import { mutateFlowEntry } from "./actions";

const input = "mt-2 w-full rounded-xl border border-border/70 bg-warm-white px-3 py-2.5 text-base outline-offset-2";
const button = "inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-warm-white transition-colors hover:bg-bluebell disabled:opacity-50";
const quiet = "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-powder disabled:opacity-50";
function timeLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "pm" : "am"}`;
}

export function WeddingFlow({ events, entries }: { events: FlowEvent[]; entries: FlowEntry[] }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? 0);
  const [side, setSide] = useState<FlowSide | "ALL">("ALL");
  const [editor, setEditor] = useState<{ entry?: FlowEntry; category: FlowCategory } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const event = events.find(e => e.id === eventId);
  const selected = entries.filter(e => e.event_id === eventId && (side === "ALL" || e.side === side || e.side === "BOTH")).sort(compareFlowEntries);
  const timeline = selected.filter(e => e.category === "Timeline");
  const ready = selected.filter(e => e.completed).length;

  function submit(form: FormData) {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await mutateFlowEntry(form);
        if (result.error) { setError(result.error); return; }
        setEditor(null); setDeleting(null);
        setMessage(form.get("operation") === "delete" ? "Entry deleted." : "Changes saved.");
        router.refresh();
      } catch { setError("Could not save this change. Please try again."); }
    });
  }
  function changeEntry(entry: FlowEntry, operation: "complete" | "delete") {
    const form = new FormData();
    form.set("operation", operation); form.set("id", String(entry.id)); form.set("revision", String(entry.revision));
    form.set("completed", String(!entry.completed)); submit(form);
  }
  function openEditor(category: FlowCategory, entry?: FlowEntry) {
    setEditor({ category, entry }); setError(""); setMessage(""); setDeleting(null);
  }
  function entryCard(entry: FlowEntry) {
    return <li key={entry.id} className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={entry.completed} disabled={pending || !!editor} onChange={() => changeEntry(entry, "complete")} aria-label={`Mark ${entry.title} ${entry.completed ? "incomplete" : "complete"}`} className="mt-1 h-5 w-5 shrink-0 accent-sage" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            {entry.time && <span className="font-medium text-bluebell tabular-nums">{timeLabel(entry.time)}</span>}
            <span className={entry.side === "BRIDE" ? "text-rose" : entry.side === "GROOM" ? "text-bluebell" : "text-sage"}>{sideLabels[entry.side]}</span>
          </div>
          <p className={`break-words font-medium ${entry.completed ? "text-text-secondary line-through" : "text-foreground"}`}>{entry.title}</p>
          {entry.owner && <p className="mt-1 break-words text-sm text-text-secondary">With {entry.owner}</p>}
          {entry.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{entry.notes}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
          <button type="button" className="rounded-lg p-2 hover:bg-powder" disabled={pending || !!editor} onClick={() => openEditor(entry.category, entry)} aria-label={`Edit ${entry.title}`}><Pencil size={16} /></button>
          <button type="button" className="rounded-lg p-2 text-text-secondary hover:bg-blush hover:text-rose" disabled={pending || !!editor} onClick={() => setDeleting(entry.id)} aria-label={`Delete ${entry.title}`}><Trash2 size={16} /></button>
        </div>
      </div>
      {deleting === entry.id && <div className="mt-3 rounded-xl bg-blush/50 p-3 text-sm"><p>Delete “{entry.title}”?</p><div className="mt-3 flex gap-2"><button className={quiet} disabled={pending || !!editor} onClick={() => changeEntry(entry, "delete")}>Delete entry</button><button className={quiet} disabled={pending || !!editor} onClick={() => setDeleting(null)}>Keep entry</button></div></div>}
    </li>;
  }

  return <div className="space-y-8 font-body leading-[1.45]">
    <PageHeader title="Wedding Flow." meta="Every detail, in its own time" />
    <p className="max-w-2xl text-text-secondary">Plan each event from getting ready to the last course. Keep both sides in sync, with a place for everything you need.</p>
    {!event ? <section className="rounded-3xl border border-border/60 bg-warm-white p-8"><h2 className="font-display text-3xl">Start with an event</h2><p className="my-4 text-text-secondary">Add your wedding events, then build a flow for each one.</p><Link className={button} href="/admin/events">Create an event</Link></section> : <>
      <section className="rounded-3xl border border-border/60 bg-warm-white p-5 sm:p-7">
        <div className="grid items-end gap-5 sm:grid-cols-[1fr_auto]">
          <label className="max-w-lg text-sm font-medium">Select an event<select className={input} value={eventId} disabled={pending || !!editor} onChange={e => { setEventId(Number(e.target.value)); setDeleting(null); setMessage(""); setError(""); }}>{events.map(e => <option key={e.id} value={e.id}>{e.name} · {e.date}</option>)}</select></label>
          <button className={button} disabled={pending || !!editor} onClick={() => openEditor("Timeline")}><Plus size={17} />Add to flow</button>
        </div>
        <p className="mt-4 text-sm text-text-secondary">{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${event.date}T00:00:00Z`))} · {timeLabel(event.time)}{event.location ? ` · ${event.location}` : ""}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5">
          <div role="group" aria-label="Wedding side" className="flex flex-wrap gap-2">{(["ALL", ...flowSides] as const).map(s => <button key={s} disabled={pending || !!editor} aria-pressed={side === s} onClick={() => { setSide(s); setDeleting(null); }} className={`rounded-full px-4 py-2 text-sm transition-colors ${side === s ? "bg-foreground text-warm-white" : "bg-powder text-text-secondary hover:bg-peach"}`}>{s === "ALL" ? "Both sides" : sideLabels[s]}</button>)}</div>
          <span className="text-sm text-text-secondary tabular-nums">{ready} of {selected.length} complete</span>
        </div>
        {(side === "BRIDE" || side === "GROOM") && <p className="mt-3 text-xs text-text-secondary">Includes shared entries.</p>}
      </section>
      <div role="status" aria-live="polite" className={message ? "text-sm text-sage" : "sr-only"}>{message}</div>
      {error && <p role="alert" className="rounded-xl bg-blush p-4 text-rose">{error}</p>}
      {editor && <section className="rounded-3xl border border-accent/50 bg-warm-white p-5 sm:p-7" aria-labelledby="entry-heading">
        <h2 id="entry-heading" className="mb-5 font-display text-3xl">{editor.entry ? "Edit entry" : "Add to the flow"}</h2>
        <form key={`${eventId}-${editor.entry?.id ?? "new"}-${editor.category}`} action={submit}>
          <input type="hidden" name="operation" value="save" /><input type="hidden" name="event_id" value={eventId} />
          {editor.entry && <><input type="hidden" name="id" value={editor.entry.id} /><input type="hidden" name="revision" value={editor.entry.revision} /></>}
          <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Category<select name="category" className={input} defaultValue={editor.category}>{flowCategories.map(c => <option key={c}>{c}</option>)}</select></label>
            <label className="text-sm">Side<select name="side" className={input} defaultValue={editor.entry?.side ?? (side === "ALL" ? "BOTH" : side)}>{flowSides.map(s => <option key={s} value={s}>{sideLabels[s]}</option>)}</select></label>
            <label className="text-sm sm:col-span-2">Name<input autoFocus required maxLength={200} name="title" defaultValue={editor.entry?.title} className={input} placeholder="Bridal jewellery, ceremony entrance, dinner service…" /></label>
            <label className="text-sm">Time (optional)<input type="time" name="time" defaultValue={editor.entry?.time?.slice(0, 5)} className={input} /><span className="mt-1 block text-xs text-text-secondary">Times follow the event date. Untimed entries appear last.</span></label>
            <label className="text-sm">Person responsible (optional)<input name="owner" maxLength={120} defaultValue={editor.entry?.owner ?? ""} className={input} placeholder="Who is taking care of this?" /></label>
            <label className="text-sm sm:col-span-2">Notes (optional)<textarea name="notes" maxLength={4000} defaultValue={editor.entry?.notes ?? ""} rows={3} className={input} placeholder="Quantities, outfit details, dishes, dietary needs, or where to bring things" /></label>
            <div className="flex flex-wrap gap-3 sm:col-span-2"><button className={button} type="submit">{pending ? "Saving…" : "Save entry"}</button><button className={quiet} type="button" onClick={() => setEditor(null)}>Cancel</button></div>
          </fieldset>
        </form>
      </section>}
      <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-border/60 bg-sky/40 p-5 sm:p-7">
          <div className="mb-2 flex items-center gap-3"><Clock3 size={22} className="text-bluebell" /><h2 className="font-display text-3xl">Run of show</h2></div>
          <p className="mb-6 text-sm text-text-secondary">The order of the day, from start to finish.</p>
          {timeline.length ? <ol className="divide-y divide-border/50">{timeline.map(entryCard)}</ol> : <p className="py-5 text-sm text-text-secondary">No timings yet. Add getting ready, arrivals, ceremonies, and celebrations.</p>}
          <button className={`${quiet} mt-6`} disabled={pending || !!editor} onClick={() => openEditor("Timeline")}><Plus size={16} />Add a moment</button>
        </section>
        <div className="space-y-5">{flowCategories.filter(c => c !== "Timeline").map(category => {
          const items = selected.filter(e => e.category === category);
          return <section key={category} className="rounded-3xl border border-border/60 bg-warm-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-2xl">{category} <span className="ml-2 font-body text-sm text-text-secondary tabular-nums">{items.length}</span></h2><button disabled={pending || !!editor} className={quiet} onClick={() => openEditor(category)} aria-label={`Add ${category.toLowerCase()}`}><Plus size={16} />Add</button></div>
            {items.length ? <ul className="divide-y divide-border/50">{items.map(entryCard)}</ul> : <p className="text-sm text-text-secondary">{category === "Menu" ? "Plan dishes, dietary needs, and serving times." : category === "Required items" ? "List ceremony essentials, gifts, and things to bring." : `Add ${category.toLowerCase()} for the bride, groom, or family.`}</p>}
          </section>;
        })}</div>
      </div>
    </>}
  </div>;
}
