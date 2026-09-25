"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { PageHeader } from "@/app/shared/PageHeader";
import {
  compareShoppingItems,
  SHOPPING_SIDE_LABELS,
  SHOPPING_URGENCY_LABELS,
  type ShoppingListItem,
  type ShoppingSide,
  type ShoppingSort,
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

function ShoppingItemForm({ entry, stores, vendors, recipients, defaultSide, onClose, onSaved }: {
  entry?: ShoppingListItem;
  stores: string[];
  vendors: string[];
  recipients: string[];
  defaultSide: ShoppingSide;
  onClose: () => void;
  onSaved: (side: ShoppingSide) => void;
}) {
  const [initial] = useState(entry);
  const [side, setSide] = useState<ShoppingSide>(initial?.side ?? defaultSide);
  const recipientListId = useId();
  const storeListId = useId();
  const vendorListId = useId();
  const save = useShoppingAction(saveShoppingListItem);

  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      save.run(new FormData(event.currentTarget), () => onSaved(side));
    }}>
      {initial && <>
        <input type="hidden" name="id" value={initial.id} />
        <input type="hidden" name="revision" value={initial.revision} />
      </>}
      <fieldset disabled={save.pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <FormField label="Item" name="item" required maxLength={200} defaultValue={initial?.item}
          placeholder="Floral garlands" className={fieldStyle} labelClassName="sm:col-span-2 [&_span]:!tracking-[0.08em]" autoFocus />
        <fieldset className="grid min-w-0 gap-5 rounded-xl border border-border/60 p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-2 text-base font-medium">Who it’s for</legend>
          <SelectField label="Side" name="side" required value={side}
            onChange={(event) => setSide(event.target.value as ShoppingSide)}
            className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]">
            <option value="BRIDE">Bride side</option>
            <option value="GROOM">Groom side</option>
          </SelectField>
          <FormField label="Person or group" name="recipient" required maxLength={160} defaultValue={initial?.recipient ?? ""}
            placeholder="Choose or enter a name" list={recipientListId} className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]" />
          <datalist id={recipientListId}>{recipients.map((recipient) => <option key={recipient} value={recipient} />)}</datalist>
        </fieldset>
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

function ShoppingItemRow({ entry, stores, vendors, recipients, onSaved }: {
  entry: ShoppingListItem;
  stores: string[];
  vendors: string[];
  recipients: string[];
  onSaved: (message: string, side?: ShoppingSide) => void;
}) {
  const [editing, setEditing] = useState(false);
  const status = useShoppingAction(setShoppingListItemPurchased);

  return (
    <li className="min-w-0 rounded-2xl border border-border/60 bg-warm-white p-5 sm:p-6">
      {editing ? <>
        <h3 className="mb-5 font-display text-2xl">Edit item</h3>
        <ShoppingItemForm entry={entry} stores={stores} vendors={vendors} recipients={recipients} defaultSide={entry.side} onClose={() => setEditing(false)} onSaved={(side) => {
          setEditing(false);
          onSaved("Item updated.", side);
        }} />
      </> : <>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto_auto] xl:items-center">
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
          <dl className="min-w-0"><dt className="mb-1 text-sm text-text-secondary">Who it’s for</dt><dd className="break-words">{entry.recipient || "Not specified"}</dd></dl>
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
  const [side, setSide] = useState<ShoppingSide>("BRIDE");
  const [sort, setSort] = useState<ShoppingSort>("priority");
  const [recipientFilter, setRecipientFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const sideItems = items.filter((item) => item.side === side);
  const purchasedCount = sideItems.filter((item) => item.purchased).length;
  const stores = [...new Set(items.map((item) => item.store))].sort();
  const vendors = [...new Set(items.map((item) => item.vendor))].sort();
  const recipients = [...new Set(["Bride", "Groom", ...items.flatMap((item) => item.recipient ? [item.recipient] : [])])].sort();
  const sideRecipients = [...new Set(sideItems.flatMap((item) => item.recipient ? [item.recipient] : []))].sort();
  const sideStores = [...new Set(sideItems.map((item) => item.store))].sort();
  const filtered = sideItems.filter((item) =>
    (filter === "all" || item.purchased === (filter === "purchased"))
    && (!recipientFilter || item.recipient === recipientFilter)
    && (!storeFilter || item.store === storeFilter)
  ).sort((a, b) => compareShoppingItems(a, b, sort));

  function resetFilters() {
    setFilter("all");
    setRecipientFilter("");
    setStoreFilter("");
  }

  return (
    <div className="space-y-7 font-body leading-[1.45] [font-kerning:normal]">
      <PageHeader title="Shopping list." meta={`${purchasedCount} of ${sideItems.length} purchased`} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-base text-text-secondary">Track what to buy, who it’s for, where to get it, and how soon you need it.</p>
        <Button className={buttonStyle} onClick={() => setAdding(true)} disabled={adding}>Add item</Button>
      </div>
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1.5" role="group" aria-label="Filter shopping list by side">
        {(["BRIDE", "GROOM"] as const).map((value) => <button key={value} type="button"
          aria-pressed={side === value} disabled={adding}
          onClick={() => { setSide(value); resetFilters(); setNotice(""); }}
          className={`cursor-pointer rounded-xl px-5 py-3 text-base font-medium transition-colors disabled:cursor-default ${side === value
            ? value === "BRIDE" ? "bg-blush text-rose" : "bg-sky text-bluebell"
            : "text-text-secondary hover:bg-powder"}`}>
          {SHOPPING_SIDE_LABELS[value]}
        </button>)}
      </div>
      <p role="status" className={notice ? "rounded-xl bg-sage-light px-5 py-3 text-sm text-sage" : "sr-only"}>{notice}</p>
      {adding && <section aria-labelledby="add-shopping-heading" className="rounded-2xl border border-accent/40 bg-warm-white p-5 sm:p-7">
        <h2 id="add-shopping-heading" className="mb-6 font-display text-3xl">Add an item</h2>
        <ShoppingItemForm stores={stores} vendors={vendors} recipients={recipients} defaultSide={side} onClose={() => setAdding(false)} onSaved={(savedSide) => {
          setAdding(false);
          setSide(savedSide);
          resetFilters();
          setNotice("Item added.");
        }} />
      </section>}
      <section aria-labelledby="shopping-list-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 id="shopping-list-heading" className="font-display text-3xl">{SHOPPING_SIDE_LABELS[side]} items</h2>
          {sideItems.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Filter shopping list by status">
            {(["all", "needed", "purchased"] as const).map((value) => <button key={value} type="button"
              aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-colors ${filter === value ? "bg-foreground text-warm-white" : "bg-warm-white text-text-secondary hover:bg-cream"}`}>
              {value === "all" ? "All" : value === "purchased" ? "Purchased" : "Still needed"}
            </button>)}
          </div>}
        </div>
        {sideItems.length > 0 && <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <SelectField label="Who it’s for" value={recipientFilter} onChange={(event) => setRecipientFilter(event.target.value)}
            className={fieldStyle} labelClassName="min-w-0 [&_span]:!tracking-[0.08em]">
            <option value="">Everyone</option>
            {sideRecipients.map((recipient) => <option key={recipient} value={recipient}>{recipient}</option>)}
          </SelectField>
          <SelectField label="Where to buy" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}
            className={fieldStyle} labelClassName="min-w-0 [&_span]:!tracking-[0.08em]">
            <option value="">All places</option>
            {sideStores.map((store) => <option key={store} value={store}>{store}</option>)}
          </SelectField>
          <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as ShoppingSort)}
            className={fieldStyle} labelClassName="min-w-0 [&_span]:!tracking-[0.08em]">
            <option value="priority">Status and urgency</option>
            <option value="recipient">Who it’s for (A–Z)</option>
            <option value="store">Where to buy (A–Z)</option>
          </SelectField>
        </div>}
        {sideItems.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-6 py-10">
          <h3 className="mb-2 font-display text-2xl">No items for the {side === "BRIDE" ? "bride" : "groom"} side yet.</h3>
          <p className="max-w-prose text-base text-text-secondary">Add an item, choose who it’s for, and enter where to buy it.</p>
        </div> : filtered.length === 0 ? <div className="space-y-3 py-6">
          <p className="text-base text-text-secondary">No items match these filters.</p>
          <Button variant="secondary" className={buttonStyle} onClick={resetFilters}>Clear filters</Button>
        </div> : <ul className="space-y-3">{filtered.map((entry) => <ShoppingItemRow key={entry.id} entry={entry} stores={stores} vendors={vendors} recipients={recipients} onSaved={(message, savedSide) => {
          setNotice(message);
          if (savedSide) {
            setSide(savedSide);
            resetFilters();
          }
        }} />)}</ul>}
      </section>
    </div>
  );
}
