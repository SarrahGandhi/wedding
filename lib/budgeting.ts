import type { Tables } from "./supabase/database.types";

export type BudgetCategory = Tables<"budget_categories">;
export type SplitType = BudgetCategory["split_type"];

export const SPLIT_LABELS: Record<SplitType, string> = {
  GROOM: "Only groom",
  BRIDE: "Only bride",
  EQUAL: "50 / 50",
  CUSTOM: "Custom amounts",
};

export const MAX_PAISE = 99_999_999_999;

// Parse decimal text directly so money never relies on floating-point rounding.
export function parseMoney(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [rupees, fraction = ""] = text.split(".");
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(paise) && paise <= MAX_PAISE ? paise : null;
}

export function moneyInput(paise: number): string {
  return (paise / 100).toFixed(2);
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(paise: number): string {
  return currency.format(paise / 100);
}

export function splitAmount(total: number, split: SplitType, customBride = 0) {
  const bride = split === "BRIDE" ? total
    : split === "GROOM" ? 0
    : split === "EQUAL" ? Math.floor(total / 2)
    : customBride;
  return { bride, groom: total - bride };
}

export function parseCategory(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const vendor = String(form.get("vendor") ?? "").trim().replace(/\s+/g, " ");
  const notes = String(form.get("notes") ?? "").trim();
  const split = String(form.get("split_type") ?? "") as SplitType;
  if (!name || name.length > 120) return { error: "Enter a category name of up to 120 characters." };
  if (vendor.length > 160) return { error: "Keep the vendor name to 160 characters." };
  if (notes.length > 2000) return { error: "Keep notes to 2,000 characters." };
  if (!Object.hasOwn(SPLIT_LABELS, split)) return { error: "Choose how to split the total." };
  const total = parseMoney(form.get("total"));
  const bridePaid = parseMoney(form.get("bride_paid"));
  const groomPaid = parseMoney(form.get("groom_paid"));
  if (total === null || bridePaid === null || groomPaid === null) {
    return { error: "Enter non-negative amounts up to ₹99,99,99,999.99, with at most two decimal places." };
  }
  const customBride = split === "CUSTOM" ? parseMoney(form.get("bride_share")) : 0;
  if (customBride === null || customBride > total) {
    return { error: "The bride’s share must be between zero and the total. The groom pays the remainder." };
  }
  const shares = splitAmount(total, split, customBride);
  return {
    data: {
      name, vendor: vendor || null, notes: notes || null, split_type: split,
      total_paise: total, bride_share_paise: shares.bride, groom_share_paise: shares.groom,
      bride_paid_paise: bridePaid, groom_paid_paise: groomPaid,
    },
  };
}

export function categoryBalance(category: BudgetCategory) {
  const paid = category.bride_paid_paise + category.groom_paid_paise;
  return { paid, balance: category.total_paise - paid };
}

export function summarizeBudget(categories: BudgetCategory[]) {
  const totals = { total: 0, brideShare: 0, groomShare: 0, bridePaid: 0, groomPaid: 0, paid: 0, outstanding: 0, credit: 0 };
  const groups = new Map<string, { key: string; name: string; count: number; total: number; bridePaid: number; groomPaid: number; balance: number }>();
  for (const category of categories) {
    totals.total += category.total_paise;
    totals.brideShare += category.bride_share_paise;
    totals.groomShare += category.groom_share_paise;
    totals.bridePaid += category.bride_paid_paise;
    totals.groomPaid += category.groom_paid_paise;
    // Unassigned categories stay separate: an overpayment to an unknown vendor
    // must not offset money owed to another unknown vendor.
    const normalizedVendor = category.vendor?.trim().replace(/\s+/g, " ");
    const key = normalizedVendor ? `vendor:${normalizedVendor.toLocaleLowerCase("en-IN")}` : `category:${category.id}`;
    const vendor = groups.get(key) ?? {
      key, name: normalizedVendor || `${category.name} (vendor not set)`, count: 0,
      total: 0, bridePaid: 0, groomPaid: 0, balance: 0,
    };
    vendor.count += 1;
    vendor.total += category.total_paise;
    vendor.bridePaid += category.bride_paid_paise;
    vendor.groomPaid += category.groom_paid_paise;
    vendor.balance += categoryBalance(category).balance;
    groups.set(key, vendor);
  }
  totals.paid = totals.bridePaid + totals.groomPaid;
  const vendors = [...groups.values()].sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
  for (const vendor of vendors) {
    totals.outstanding += Math.max(0, vendor.balance);
    totals.credit += Math.max(0, -vendor.balance);
  }
  return { totals, vendors };
}
