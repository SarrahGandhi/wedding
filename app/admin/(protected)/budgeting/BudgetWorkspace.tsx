"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField, TextareaField } from "@/app/shared/FormField";
import { PageHeader } from "@/app/shared/PageHeader";
import {
  categoryBalance, formatMoney, moneyInput, parseMoney, splitAmount,
  SPLIT_LABELS, summarizeBudget, type BudgetCategory, type SplitType,
} from "@/lib/budgeting";
import { deleteCategory, saveCategory } from "./actions";

const buttonStyle = "rounded-full px-5 py-3 !tracking-[0.08em]";
const amountProps = { type: "number", min: "0", max: "999999999.99", step: "0.01", inputMode: "decimal", required: true } as const;

function useBudgetAction(action: typeof saveCategory) {
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
        setError("The change could not be confirmed. Refresh the page to check the saved amounts before trying again.");
      }
    });
  }
  return { pending, error, run };
}

function SideFigures({ side, share, paid }: { side: "Bride" | "Groom"; share: number; paid: number }) {
  const balance = share - paid;
  return (
    <div className={`min-w-0 rounded-2xl p-4 sm:p-5 ${side === "Bride" ? "bg-blush/45" : "bg-sky/65"}`}>
      <p className={`mb-4 text-sm font-medium ${side === "Bride" ? "text-rose" : "text-bluebell"}`}>{side}’s side</p>
      <dl className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-1 xl:grid-cols-3">
        {[
          { label: "Assigned share", value: share },
          { label: "Paid so far", value: paid },
          { label: balance < 0 ? "Paid above share" : "Share remaining", value: Math.abs(balance) },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 min-[480px]:block sm:flex xl:block">
            <dt className="text-xs leading-snug text-text-secondary">{label}</dt>
            <dd className="mt-1 break-words text-base font-medium tabular-nums">{formatMoney(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CategoryForm({ category, vendors, onClose, onSaved }: {
  category?: BudgetCategory; vendors: string[]; onClose: () => void; onSaved: () => void;
}) {
  // Keep the revision associated with the opened form, even when another
  // admin's update refreshes the surrounding page while this form is open.
  const [initial] = useState(category);
  const [split, setSplit] = useState<SplitType>(initial?.split_type ?? "EQUAL");
  const [totalText, setTotalText] = useState(initial ? moneyInput(initial.total_paise) : "");
  const [brideText, setBrideText] = useState(initial ? moneyInput(initial.bride_share_paise) : "");
  const vendorListId = useId();
  const hintId = useId();
  const save = useBudgetAction(saveCategory);
  const total = parseMoney(totalText);
  const customBride = parseMoney(brideText);
  const validSplit = total !== null && (split !== "CUSTOM" || (customBride !== null && customBride <= total));
  const shares = validSplit ? splitAmount(total!, split, customBride ?? 0) : null;

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!save.pending) save.run(new FormData(event.currentTarget), onSaved);
    }} className="space-y-6" aria-label={initial ? `Edit ${initial.name}` : "Add category"}>
      {initial && <>
        <input type="hidden" name="id" value={initial.id} />
        <input type="hidden" name="revision" value={initial.revision} />
      </>}
      <fieldset disabled={save.pending} className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Category" name="name" autoFocus maxLength={120} required defaultValue={initial?.name} placeholder="Venue, catering, photography…" />
        <FormField label="Vendor (optional)" name="vendor" maxLength={160} defaultValue={initial?.vendor ?? ""} list={vendorListId} placeholder="Who is this payment going to?" />
        <datalist id={vendorListId}>{vendors.map((vendor) => <option key={vendor} value={vendor} />)}</datalist>
        <FormField label="Total amount (₹)" name="total" {...amountProps} value={totalText} onChange={(event) => setTotalText(event.target.value)} placeholder="0.00" />
        <SelectField label="Split the cost" aria-label="Split the cost" name="split_type" value={split} onChange={(event) => {
          const next = event.target.value as SplitType;
          if (next === "CUSTOM" && shares) setBrideText(moneyInput(shares.bride));
          setSplit(next);
        }}>
          {(Object.entries(SPLIT_LABELS) as [SplitType, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        {split === "CUSTOM" ? <>
          <FormField label="Bride’s share (₹)" name="bride_share" {...amountProps} max={total === null ? amountProps.max : moneyInput(total)} value={brideText} onChange={(event) => setBrideText(event.target.value)} aria-describedby={hintId} />
          <FormField label="Groom’s share (₹)" type="text" readOnly value={shares ? moneyInput(shares.groom) : ""} placeholder="Calculated from the total" aria-describedby={hintId} className="bg-powder" />
          <p id={hintId} className="-mt-2 text-sm leading-relaxed text-text-secondary md:col-span-2">Enter the bride’s amount; the remaining amount is assigned to the groom.</p>
        </> : <div className="rounded-xl bg-powder p-4 text-sm md:col-span-2" aria-live="polite">
          {shares ? <p className="flex flex-wrap gap-x-8 gap-y-2 tabular-nums"><span>Bride’s share <strong className="ml-2 font-medium">{formatMoney(shares.bride)}</strong></span><span>Groom’s share <strong className="ml-2 font-medium">{formatMoney(shares.groom)}</strong></span></p> : <p className="text-text-secondary">Enter a total to see each side’s share.</p>}
          {split === "EQUAL" && total !== null && total % 2 !== 0 && <p className="mt-2 text-xs text-text-secondary">The extra ₹0.01 is assigned to the groom so the shares add up exactly.</p>}
        </div>}
        <div className="border-t border-border/50 pt-5 md:col-span-2">
          <h3 className="mb-2 text-base font-medium">Payments made</h3>
          <p className="max-w-prose text-sm leading-relaxed text-text-secondary">Enter the total each side has paid to this vendor for this category so far. Update these amounts as more payments are made.</p>
        </div>
        <FormField label="Paid by bride (₹)" name="bride_paid" {...amountProps} defaultValue={initial ? moneyInput(initial.bride_paid_paise) : "0"} />
        <FormField label="Paid by groom (₹)" name="groom_paid" {...amountProps} defaultValue={initial ? moneyInput(initial.groom_paid_paise) : "0"} />
        <TextareaField label="Notes (optional)" name="notes" rows={2} maxLength={2000} defaultValue={initial?.notes ?? ""} placeholder="Deposit, due date, or payment details…" labelClassName="md:col-span-2" />
      </fieldset>
      {save.error && <p role="alert" className="text-sm text-rose">{save.error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" pending={save.pending} disabled={save.pending || !validSplit} className={buttonStyle}>{save.pending ? "Saving…" : initial ? "Save changes" : "Add category"}</Button>
        <Button variant="secondary" disabled={save.pending} onClick={onClose} className={buttonStyle}>Cancel</Button>
      </div>
    </form>
  );
}

function CategoryCard({ category, vendors, onSaved }: { category: BudgetCategory; vendors: string[]; onSaved: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useBudgetAction(deleteCategory);
  const { paid, balance } = categoryBalance(category);

  return (
    <article className="min-w-0 rounded-3xl border border-border/60 bg-warm-white p-5 sm:p-6" aria-label={category.name}>
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <p className="mb-1 break-words text-sm text-text-secondary">{category.vendor || "Vendor not set"}</p>
          <h3 className="break-words font-display text-2xl leading-tight sm:text-3xl">{category.name}</h3>
        </div>
        {!editing && <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" className={`${buttonStyle} flex items-center gap-2`} onClick={() => { setEditing(true); setConfirmDelete(false); }} disabled={remove.pending}><Pencil size={14} aria-hidden="true" /> Edit / payments</Button>
          <Button variant="danger" className={`${buttonStyle} flex items-center gap-2`} aria-label={`Delete ${category.name}`} disabled={remove.pending} onClick={() => setConfirmDelete(true)}><Trash2 size={15} aria-hidden="true" /></Button>
        </div>}
      </div>
      {editing ? <CategoryForm category={category} vendors={vendors} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved("Category and payments updated."); }} /> : <>
        <div className="mb-5 flex flex-col justify-between gap-4 min-[480px]:flex-row min-[480px]:items-end">
          <div><p className="mb-1 text-xs text-text-secondary">Total cost · {SPLIT_LABELS[category.split_type]}</p><p className="break-words text-2xl font-medium tabular-nums">{formatMoney(category.total_paise)}</p></div>
          <div className="min-[480px]:text-right"><p className={`text-sm font-medium ${balance > 0 ? "text-rose" : "text-sage"}`}>{balance === 0 ? "Paid in full" : `${formatMoney(Math.abs(balance))} ${balance > 0 ? "remaining" : "overpaid"}`}</p><p className="mt-1 text-xs text-text-secondary tabular-nums">{formatMoney(paid)} paid in total</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SideFigures side="Bride" share={category.bride_share_paise} paid={category.bride_paid_paise} />
          <SideFigures side="Groom" share={category.groom_share_paise} paid={category.groom_paid_paise} />
        </div>
        {category.notes && <p className="mt-4 max-w-prose whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{category.notes}</p>}
      </>}
      {confirmDelete && <div className="mt-5 rounded-xl bg-blush/50 p-4" role="group" aria-label="Confirm deletion">
        <p className="mb-3 text-sm leading-relaxed">Delete “{category.name}”? Its cost and both sides’ recorded payments will be removed from the totals.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" className={buttonStyle} pending={remove.pending} onClick={() => {
            const form = new FormData();
            form.set("id", String(category.id));
            form.set("revision", String(category.revision));
            remove.run(form, () => onSaved("Category deleted."));
          }}>{remove.pending ? "Deleting…" : "Delete category"}</Button>
          <Button variant="secondary" className={buttonStyle} disabled={remove.pending} onClick={() => setConfirmDelete(false)}>Keep category</Button>
        </div>
      </div>}
      {remove.error && <p role="alert" className="mt-3 text-sm text-rose">{remove.error}</p>}
    </article>
  );
}

export function BudgetWorkspace({ categories }: { categories: BudgetCategory[] }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const { totals, vendors } = summarizeBudget(categories);
  const vendorNames = [...new Set(categories.flatMap((category) => category.vendor ? [category.vendor] : []))].sort();
  const filtered = categories.filter((category) => `${category.name} ${category.vendor ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return (
    <div className="space-y-8 font-body [font-kerning:normal]">
      <div>
        <PageHeader title="Budgeting." meta="All amounts in INR" />
        <div className="-mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <p className="max-w-xl text-base leading-relaxed text-text-secondary">A shared view of your wedding expenses, who’s paying, and what’s left to pay.</p>
          <Button className={`${buttonStyle} flex shrink-0 items-center justify-center gap-2 self-start`} onClick={() => { setAdding(true); setNotice(""); }} disabled={adding}><Plus size={16} aria-hidden="true" /> Add category</Button>
        </div>
      </div>

      {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-sage-light px-4 py-3 text-sm text-sage"><span className="flex items-center gap-2"><Check size={16} aria-hidden="true" />{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="cursor-pointer p-2"><X size={16} aria-hidden="true" /></button></div>}

      <section aria-label="Budget summary" className="rounded-3xl border border-border/60 bg-warm-white p-5 sm:p-7">
        <dl className="grid gap-6 sm:grid-cols-3">
          {[
            { label: "Total expenses", value: totals.total, hint: `${categories.length} ${categories.length === 1 ? "category" : "categories"}` },
            { label: "Paid so far", value: totals.paid, hint: "Bride and groom combined" },
            { label: "Still owed to vendors", value: totals.outstanding, hint: "Across all unpaid vendors" },
          ].map(({ label, value, hint }) => <div key={label} className="min-w-0"><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-2 break-words text-2xl font-medium leading-tight tabular-nums lg:text-3xl">{formatMoney(value)}</dd><dd className="mt-2 text-xs text-text-secondary">{hint}</dd></div>)}
        </dl>
        {totals.credit > 0 && <p className="mt-5 text-sm text-sage">Vendor credit: <span className="font-medium tabular-nums">{formatMoney(totals.credit)}</span>. Overpayments are kept separate from amounts owed to other vendors.</p>}
        <div className="mt-6 grid gap-3 border-t border-border/50 pt-6 sm:grid-cols-2">
          <SideFigures side="Bride" share={totals.brideShare} paid={totals.bridePaid} />
          <SideFigures side="Groom" share={totals.groomShare} paid={totals.groomPaid} />
        </div>
        <p className="mt-4 max-w-prose text-xs leading-relaxed text-text-secondary">Share remaining compares each side’s assigned costs with what they’ve paid. Either side can pay on the other’s behalf; vendor balances use both sides’ payments.</p>
      </section>

      {adding && <section className="rounded-3xl border border-accent/40 bg-warm-white p-5 sm:p-7" aria-labelledby="new-category-heading"><h2 id="new-category-heading" className="mb-6 font-display text-3xl">Add a category</h2><CategoryForm vendors={vendorNames} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setNotice("Category added."); }} /></section>}

      {categories.length > 0 && <section aria-labelledby="vendor-heading">
        <h2 id="vendor-heading" className="font-display text-3xl">Vendor balances</h2>
        <p className="mb-5 mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">Categories with the same vendor name are combined here. Credits are applied only within that vendor’s total.</p>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-warm-white" role="region" aria-label="Vendor balances table" tabIndex={0}>
          <table className="w-full text-sm tabular-nums">
            <caption className="sr-only">Total cost, payments by each side, and remaining amount for every vendor</caption>
            <thead className="border-b border-border/60 bg-powder/70 text-text-secondary"><tr>{["Vendor", "Total cost", "Bride paid", "Groom paid", "Balance"].map((label, index) => <th key={label} scope="col" className={`whitespace-nowrap px-5 py-4 font-medium ${index === 0 ? "text-left" : "text-right"}`}>{label}</th>)}</tr></thead>
            <tbody>{vendors.map((vendor) => <tr key={vendor.key}>
              <th scope="row" className="min-w-44 max-w-xs break-words px-5 py-4 text-left font-medium">{vendor.name}<span className="mt-1 block text-xs font-normal text-text-secondary">{vendor.count} {vendor.count === 1 ? "category" : "categories"}</span></th>
              <td className="whitespace-nowrap px-5 py-4 text-right">{formatMoney(vendor.total)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right">{formatMoney(vendor.bridePaid)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right">{formatMoney(vendor.groomPaid)}</td>
              <td className={`whitespace-nowrap px-5 py-4 text-right font-medium ${vendor.balance > 0 ? "text-rose" : "text-sage"}`}>{vendor.balance === 0 ? "Paid in full" : <>{formatMoney(Math.abs(vendor.balance))}<span className="mt-1 block text-xs font-normal">{vendor.balance < 0 ? "Credit" : "Still owed"}</span></>}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>}

      <section aria-labelledby="categories-heading">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 id="categories-heading" className="font-display text-3xl">Your categories</h2>
          {categories.length > 0 && <label className="block sm:w-72"><span className="sr-only">Search categories or vendors</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories or vendors" className="w-full rounded-full border border-border bg-warm-white px-4 py-3 text-base sm:text-sm" /></label>}
        </div>
        {categories.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-warm-white/50 px-6 py-10"><h3 className="mb-3 font-display text-2xl">Start with your first expense.</h3><p className="mb-5 max-w-prose text-sm leading-relaxed text-text-secondary">Add a category such as venue or catering, enter its total, and choose how you’ll share the cost. You can add the vendor and any payments already made.</p><Button variant="secondary" className={buttonStyle} onClick={() => setAdding(true)} disabled={adding}>Add your first category</Button></div>
          : filtered.length === 0 ? <p className="py-6 text-sm text-text-secondary">No categories match this search. Try a different category or vendor name.</p>
          : <div className="space-y-4">{filtered.map((category) => <CategoryCard key={category.id} category={category} vendors={vendorNames} onSaved={setNotice} />)}</div>}
      </section>
    </div>
  );
}
