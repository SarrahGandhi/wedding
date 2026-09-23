import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import type { Task } from "@/lib/tasks";
import { compareShoppingItems, type ShoppingListItem } from "@/lib/shopping-list";
import { PageHeader } from "@/app/shared/PageHeader";
import { TasksPageWorkspace } from "./TasksPageWorkspace";

export const metadata: Metadata = { title: "Tasks | Murtaza & Sarrah" };

async function loadAll<T>(
  fetch: (offset: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[]; error: boolean }> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await fetch(offset);
    if (error || !data) return { data: rows, error: true };
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return { data: rows, error: false };
}

export default async function TasksPage() {
  const { supabase } = await requireAdmin();
  const [tasksResult, shoppingResult] = await Promise.all([
    loadAll<Task>(async (offset) => supabase.from("tasks").select("*")
      .order("completed").order("due_date").order("id").range(offset, offset + 999)),
    loadAll<ShoppingListItem>(async (offset) => supabase.from("shopping_list_items")
      .select("id,item,store,vendor,urgency,purchased,revision,created_at,side,recipient")
      .order("id").range(offset, offset + 999)),
  ]);
  if (tasksResult.error) {
    return <div>
      <PageHeader title="Tasks." />
      <p role="alert" className="rounded-2xl bg-blush/50 p-6 text-rose">
        Tasks could not be loaded. Please refresh the page or try again shortly.
      </p>
    </div>;
  }
  const shoppingItems = shoppingResult.error ? [] : [...shoppingResult.data].sort(compareShoppingItems);
  return <TasksPageWorkspace
    tasks={tasksResult.data}
    shoppingItems={shoppingItems}
    shoppingUnavailable={shoppingResult.error}
  />;
}
