import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import type { BudgetCategory } from "@/lib/budgeting";
import { PageHeader } from "@/app/shared/PageHeader";
import { BudgetWorkspace } from "./BudgetWorkspace";

export const metadata: Metadata = { title: "Budgeting | Murtaza & Sarrah" };

export default async function BudgetingPage() {
  const { supabase } = await requireAdmin();
  const categories: BudgetCategory[] = [];
  // Read every row, including budgets beyond the API's default 1,000-row limit.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("budget_categories").select("*")
      .order("id", { ascending: true }).range(offset, offset + 999);
    if (error) {
      return <div>
        <PageHeader title="Budgeting." />
        <p role="alert" className="rounded-2xl bg-blush/50 p-6 text-rose">
          Budgeting could not be loaded. Please refresh the page or try again shortly.
        </p>
      </div>;
    }
    categories.push(...data);
    if (data.length < 1000) break;
  }

  return <BudgetWorkspace categories={categories} />;
}
