"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { PageHeader } from "@/app/shared/PageHeader";
import {
  SHOPPING_URGENCY_LABELS,
  type ShoppingListItem,
  type ShoppingUrgency,
} from "@/lib/shopping-list";
import { saveShoppingListItem, setShoppingListItemPurchased } from "./shopping-actions";

const buttonStyle = "rounded-full px-5 py-3 !tracking-[0.08em]";
const fieldStyle = "rounded-xl !tracking-normal";

const URGENCY_BADGE: Record<ShoppingUrgency, string> = {
  LOW: "bg-powder text-text-secondary",
  MEDIUM: "bg-sky/40 text-bluebell",
  HIGH: "bg-blush text-rose",
};

function useShoppingAction(action: typeof saveShoppingListItem) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(form: FormData, onSuccess: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(form);
        if (result.error) {
          setError(result.error);
          router.refresh();
        } else {
          onSuccess();
        }
      } catch {
        setError("The change could not be confirmed. Refresh the page to check the item before trying again.");
      }
    });
  }
  return { pending, error, run };
}

function ShoppingItemForm({ entry, stores, vendors, onClose, onSaved }: {
  entry?: ShoppingListItem;
  stores: string[];
  vendors: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [initial] = useState(entry);
  const storeListId = useId();
  const vendorListId = useId();
  const save = useShoppingAction(saveShoppingListItem);

  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      save.run(new FormData(event.currentTarget), onSaved);
    }}>
      {initial && <>
        <input type="hidden" name="id" value={initial.id} />
        <input type="hidden" name="revision" value={initial.revision} />
      </>}
      <fieldset disabled={save.pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <FormField label="Item" name="item" required maxLength={200} defaultValue={initial?.item}
          placeholder="Floral garlands" className={fieldStyle} labelClassName="sm:col-span-2 [&_span]:!tracking-[0.08em]" autoFocus />
        <FormField label="Where to buy" name="store" required maxLength={160} defaultValue={initial?.store}
          placeholder="Chor Bazaar" list={storeListId} className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]" />
        <datalist id={storeListId}>{stores.map((store) => <option key={store} value={store} />)}</datalist>
        <FormField label="Buying from" name="vendor" required maxLength={160} defaultValue={initial?.vendor}
          placeholder="Vendor or contact name" list={vendorListId} className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]" />
        <datalist id={vendorListId}>{vendors.map((vendor) => <option key={vendor} value={vendor} />)}</datalist>
        <SelectField label="Urgency" name="urgency" required defaultValue={initial?.urgency ?? "MEDIUM"}
          className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]">
          {(Object.keys(SHOPPING_URGENCY_LABELS) as ShoppingUrgency[]).map((level) => (
            <option key={level} value={level}>{SHOPPING_URGENCY_LABELS[level]}</option>
          ))}
        </SelectField>
        <label className="flex items-center gap-3 text-base sm:col-span-2">
          <input type="checkbox" name="purchased" defaultChecked={initial?.purchased ?? false} className="h-5 w-5 accent-sage" />
          Purchased
        </label>
      </fieldset>
      {save.error && <p role="alert" className="text-sm text-rose">{save.error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" pending={save.pending} className={buttonStyle}>
          {save.pending ? "Saving…" : initial ? "Save changes" : "Add item"}
        </Button>
        <Button variant="secondary" disabled={save.pending} onClick={onClose} className={buttonStyle}>Cancel</Button>
      </div>
    </form>
  );
}

function ShoppingItemRow({ entry, stores, vendors, onSaved }: {
  entry: ShoppingListItem;
  stores: string[];
  vendors: string[];
  onSaved: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const status = useShoppingAction(setShoppingListItemPurchased);

  return (
    <li className="min-w-0 rounded-2xl border border-border/60 bg-warm-white p-5 sm:p-6">
      {editing ? <>
        <h3 className="mb-5 font-display text-2xl">Edit item</h3>
        <ShoppingItemForm entry={entry} stores={stores} vendors={vendors} onClose={() => setEditing(false)} onSaved={() => {
          setEditing(false);
          onSaved("Item updated.");
        }} />
      </> : <>
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-center">
          <div className="min-w-0">
            <h3 className={`break-words text-lg font-medium ${entry.purchased ? "text-text-secondary line-through" : "text-foreground"}`}>{entry.item}</h3>
            <label className={`mt-3 inline-flex cursor-pointer items-center gap-3 text-sm ${entry.purchased ? "text-sage" : "text-text-secondary"}`}>
              <input type="checkbox" checked={entry.purchased} disabled={status.pending}
                aria-label={`Mark ${entry.item} ${entry.purchased ? "not purchased" : "purchased"}`}
                className="h-5 w-5 accent-sage disabled:opacity-50" onChange={(event) => {
                  const purchased = event.target.checked;
                  const form = new FormData();
                  form.set("id", String(entry.id));
                  form.set("revision", String(entry.revision));
                  form.set("purchased", String(purchased));
                  status.run(form, () => onSaved(purchased ? "Item marked purchased." : "Item marked not purchased."));
                }} />
              {status.pending ? "Saving…" : entry.purchased ? "Purchased" : "Still needed"}
            </label>
          </div>
          <dl className="min-w-0"><dt className="mb-1 text-sm text-text-secondary">Where to buy</dt><dd className="break-words">{entry.store}</dd></dl>
          <dl className="min-w-0"><dt className="mb-1 text-sm text-text-secondary">Buying from</dt><dd className="break-words">{entry.vendor}</dd></dl>
          <span className={`justify-self-start rounded-full px-3 py-1.5 text-sm font-medium ${URGENCY_BADGE[entry.urgency]}`}>
            {SHOPPING_URGENCY_LABELS[entry.urgency]}
          </span>
          <Button variant="secondary" className={`${buttonStyle} justify-self-start`} disabled={status.pending}
            aria-label={`Edit ${entry.item}`} onClick={() => setEditing(true)}>Edit</Button>
        </div>
        {status.error && <p role="alert" className="mt-4 text-sm text-rose">{status.error}</p>}
      </>}
    </li>
  );
}

export function ShoppingListWorkspace({ items }: { items: ShoppingListItem[] }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "needed" | "purchased">("all");
  const [notice, setNotice] = useState("");
  const purchasedCount = items.filter((item) => item.purchased).length;
  const stores = [...new Set(items.map((item) => item.store))].sort();
  const vendors = [...new Set(items.map((item) => item.vendor))].sort();
  const filtered = items.filter((item) => filter === "all" || item.purchased === (filter === "purchased"));

  return (
    <div className="space-y-7 font-body leading-[1.45] [font-kerning:normal]">
      <PageHeader title="Shopping list." meta={`${purchasedCount} of ${items.length} purchased`} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-base text-text-secondary">Track what to buy, where to get it, who supplies it, and how soon you need it.</p>
        <Button className={buttonStyle} onClick={() => setAdding(true)} disabled={adding}>Add item</Button>
      </div>
      <p role="status" className={notice ? "rounded-xl bg-sage-light px-5 py-3 text-sm text-sage" : "sr-only"}>{notice}</p>
      {adding && <section aria-labelledby="add-shopping-heading" className="rounded-2xl border border-accent/40 bg-warm-white p-5 sm:p-7">
        <h2 id="add-shopping-heading" className="mb-6 font-display text-3xl">Add an item</h2>
        <ShoppingItemForm stores={stores} vendors={vendors} onClose={() => setAdding(false)} onSaved={() => {
          setAdding(false);
          setFilter("all");
          setNotice("Item added.");
        }} />
      </section>}
      <section aria-labelledby="shopping-list-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 id="shopping-list-heading" className="font-display text-3xl">Items</h2>
          {items.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Filter shopping list">
            {(["all", "needed", "purchased"] as const).map((value) => <button key={value} type="button"
              aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-colors ${filter === value ? "bg-foreground text-warm-white" : "bg-warm-white text-text-secondary hover:bg-cream"}`}>
              {value === "all" ? "All" : value === "purchased" ? "Purchased" : "Still needed"}
            </button>)}
          </div>}
        </div>
        {items.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-6 py-10">
          <h3 className="mb-2 font-display text-2xl">Nothing on the list yet.</h3>
          <p className="max-w-prose text-base text-text-secondary">Add an item with where to buy, whom you are buying from, and how urgent it is.</p>
        </div> : filtered.length === 0 ? <p className="py-6 text-base text-text-secondary">No {filter === "purchased" ? "purchased" : "needed"} items. Choose another filter to see the rest.</p>
          : <ul className="space-y-3">{filtered.map((entry) => <ShoppingItemRow key={entry.id} entry={entry} stores={stores} vendors={vendors} onSaved={setNotice} />)}</ul>}
      </section>
    </div>
  );
}
