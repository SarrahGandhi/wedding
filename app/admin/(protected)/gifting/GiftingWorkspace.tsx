"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { CATEGORY_STATUSES, GIFT_STATUSES, moveEntry, type GiftStatus, type GiftCategoryStatus, type GiftRecipient } from "@/lib/gifting";
import { saveGiftPlan } from "./actions";

const inputClass = "w-full rounded-lg border border-border bg-warm-white px-3 py-2 text-base focus:border-accent";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed";

function OrderControls({ label, index, length, move, remove }: {
  label: string; index: number; length: number; move: (direction: -1 | 1) => void; remove: () => void;
}) {
  return <div className="flex shrink-0 gap-1">
    <button type="button" className={buttonClass} aria-label={`Move ${label} up`} title="Move up" disabled={index === 0} onClick={() => move(-1)}><ArrowUp size={16} /></button>
    <button type="button" className={buttonClass} aria-label={`Move ${label} down`} title="Move down" disabled={index === length - 1} onClick={() => move(1)}><ArrowDown size={16} /></button>
    <button type="button" className={`${buttonClass} text-rose`} aria-label={`Remove ${label}`} title="Remove" onClick={remove}><Trash2 size={16} /></button>
  </div>;
}

export function GiftingWorkspace({ initialRecipients, initialRevision }: { initialRecipients: GiftRecipient[]; initialRevision: number }) {
  const [recipients, setRecipients] = useState(initialRecipients);
  const [revision, setRevision] = useState(initialRevision);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor && anchor.href !== window.location.href && !window.confirm("Leave this page? Your unsaved gifting changes will be lost.")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);

  function change(next: GiftRecipient[]) { setRecipients(next); setDirty(true); setMessage(""); setError(""); }
  function editRecipient(index: number, next: GiftRecipient) { change(recipients.map((recipient, i) => i === index ? next : recipient)); }
  function confirmRemove(label: string) { return window.confirm(`Remove ${label} and everything inside it? Save changes to make this permanent.`); }

  async function save() {
    setPending(true); setError(""); setMessage("");
    try {
      const result = await saveGiftPlan(recipients, revision);
      if (result.error) setError(result.error);
      else if (result.revision) { setRevision(result.revision); setDirty(false); setMessage("Gifting plan saved."); }
    } catch { setError("Your plan could not be saved. Your edits are still here. Try saving again."); }
    finally { setPending(false); }
  }

  const giftCount = recipients.reduce((total, recipient) => total + recipient.categories.reduce((count, category) => count + category.gifts.length, 0), 0);

  return <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="font-body text-foreground">
    <div className="mb-8 max-w-2xl space-y-2 text-base leading-relaxed text-text-secondary">
      <p>A gift plan for each person, organised by category. Keep flowers, wrapping, cards, and other creative requirements with the category they belong to.</p>
      <p className="text-sm">Use the arrows to arrange everything in your preferred order.</p>
    </div>
    <fieldset disabled={pending} className="min-w-0 space-y-8">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-warm-white/95 p-4 backdrop-blur-sm">
        <div><p className="text-sm tabular-nums">{recipients.length} {recipients.length === 1 ? "recipient" : "recipients"} · {giftCount} {giftCount === 1 ? "gift" : "gifts"}</p><p className="mt-1 text-sm text-text-secondary" role="status">{pending ? "Saving…" : dirty ? "Unsaved changes" : message || "All changes saved"}</p></div>
        <button type="submit" disabled={!dirty || pending} className="min-h-11 rounded-lg bg-foreground px-5 py-2 text-sm text-warm-white hover:bg-accent disabled:opacity-40">{pending ? "Saving…" : "Save changes"}</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-blush p-4 text-rose">{error}</p>}
      {recipients.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8"><h2 className="font-display text-3xl">Who are you gifting to?</h2><p className="mt-2 text-text-secondary">Add a recipient, then create a category and list their gifts.</p></div>}
      {recipients.map((recipient, ri) => <section key={recipient.id} className="rounded-2xl border border-border bg-warm-white/60 p-4 sm:p-6" aria-label={recipient.name || "New recipient"}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-0 flex-1 basis-52"><span className="mb-2 block text-sm font-medium">Recipient name</span><input aria-label={`Recipient ${ri + 1} name`} required maxLength={160} value={recipient.name} placeholder="Who is this for?" className={`${inputClass} font-display text-2xl`} onChange={(event) => editRecipient(ri, { ...recipient, name: event.target.value })} /></label>
          <OrderControls label={recipient.name || "recipient"} index={ri} length={recipients.length} move={(direction) => change(moveEntry(recipients, ri, direction))} remove={() => { if (confirmRemove(recipient.name || "this recipient")) change(recipients.filter((_, i) => i !== ri)); }} />
        </div>
        <div className="space-y-5">
          {recipient.categories.map((category, ci) => {
            const editCategory = (next: typeof category) => editRecipient(ri, { ...recipient, categories: recipient.categories.map((entry, i) => i === ci ? next : entry) });
            return <section key={category.id} className="rounded-xl bg-background p-4 sm:p-5" aria-label={category.name || "New category"}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <label className="min-w-0 flex-1 basis-48"><span className="mb-2 block text-sm font-medium">Category / theme</span><input required maxLength={160} value={category.name} placeholder="e.g. Wedding hamper" className={inputClass} onChange={(event) => editCategory({ ...category, name: event.target.value })} /></label>
                <label className="w-full sm:w-auto"><span className="mb-2 block text-sm font-medium">Category status</span><select aria-label={`Status for ${category.name || "category"}`} className={inputClass} value={category.status} onChange={(event) => editCategory({ ...category, status: event.target.value as GiftCategoryStatus })}>{CATEGORY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                <OrderControls label={category.name || "category"} index={ci} length={recipient.categories.length} move={(direction) => editRecipient(ri, { ...recipient, categories: moveEntry(recipient.categories, ci, direction) })} remove={() => { if (confirmRemove(category.name || "this category")) editRecipient(ri, { ...recipient, categories: recipient.categories.filter((_, i) => i !== ci) }); }} />
              </div>
              <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div><h3 className="mb-3 text-sm font-medium">Gifts</h3>
                  {category.gifts.length === 0 && <p className="mb-3 text-sm text-text-secondary">Add the gifts that belong in this category.</p>}
                  <ol className="space-y-3">{category.gifts.map((gift, gi) => <li key={gift.id} className="flex flex-wrap items-end gap-2">
                    <input required maxLength={200} aria-label={`Gift ${gi + 1} in ${category.name || "category"}`} placeholder="Gift item" value={gift.name} className={`${inputClass} min-w-0 flex-1 basis-36`} onChange={(event) => editCategory({ ...category, gifts: category.gifts.map((entry, i) => i === gi ? { ...entry, name: event.target.value } : entry) })} />
                    <label className="w-36"><span className="mb-1 block text-sm text-text-secondary">Gift status</span><select aria-label={`Status for ${gift.name || `gift ${gi + 1}`}`} className={inputClass} value={gift.status} onChange={(event) => editCategory({ ...category, gifts: category.gifts.map((entry, i) => i === gi ? { ...entry, status: event.target.value as GiftStatus } : entry) })}>{GIFT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <OrderControls label={gift.name || "gift"} index={gi} length={category.gifts.length} move={(direction) => editCategory({ ...category, gifts: moveEntry(category.gifts, gi, direction) })} remove={() => { if (!gift.name || confirmRemove(gift.name)) editCategory({ ...category, gifts: category.gifts.filter((_, i) => i !== gi) }); }} />
                  </li>)}</ol>
                  <button type="button" className={`${buttonClass} mt-3`} onClick={() => editCategory({ ...category, gifts: [...category.gifts, { id: crypto.randomUUID(), name: "", status: "Awaiting" }] })}><Plus size={16} /> Add gift</button>
                </div>
                <label><span className="mb-2 block text-sm font-medium">Creative requirements</span><textarea maxLength={5000} rows={5} value={category.creatives} placeholder="e.g. Flowers for decoration, ribbon, a printed name card…" className={inputClass} onChange={(event) => editCategory({ ...category, creatives: event.target.value })} /><span className="mt-2 block text-sm text-text-secondary">Shared by all gifts in this category.</span></label>
              </div>
            </section>;
          })}
        </div>
        <button type="button" className={`${buttonClass} mt-5`} onClick={() => editRecipient(ri, { ...recipient, categories: [...recipient.categories, { id: crypto.randomUUID(), name: "", status: "Awaiting", creatives: "", gifts: [] }] })}><Plus size={16} /> Add category</button>
      </section>)}
      <button type="button" className={buttonClass} onClick={() => change([...recipients, { id: crypto.randomUUID(), name: "", categories: [] }])}><Plus size={16} /> Add recipient</button>
    </fieldset>
  </form>;
}
