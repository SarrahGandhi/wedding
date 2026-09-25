"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks";
import type { ShoppingListItem } from "@/lib/shopping-list";
import { ShoppingListWorkspace } from "./ShoppingListWorkspace";
import { TasksWorkspace } from "./TasksWorkspace";

type Tab = "tasks" | "shopping";

export function TasksPageWorkspace({ tasks, shoppingItems, shoppingUnavailable = false }: {
  tasks: Task[];
  shoppingItems: ShoppingListItem[];
  shoppingUnavailable?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("tasks");

  return (
    <div className="space-y-7">
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1.5" role="tablist" aria-label="Tasks workspace">
        {([
          { id: "tasks" as const, label: "Tasks" },
          { id: "shopping" as const, label: "Shopping list" },
        ]).map(({ id, label }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} id={`tab-${id}`}
            aria-controls={`panel-${id}`} onClick={() => setTab(id)}
            className={`cursor-pointer rounded-xl px-5 py-3 text-base font-medium transition-colors ${tab === id
              ? "bg-foreground text-warm-white"
              : "text-text-secondary hover:bg-powder"}`}>
            {label}
          </button>
        ))}
      </div>
      {shoppingUnavailable && tab === "shopping" && <p role="alert" className="rounded-2xl bg-blush/50 p-6 text-rose">
        The shopping list is not available yet. Apply the latest Supabase migration, then refresh this page.
      </p>}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "tasks" ? <TasksWorkspace tasks={tasks} />
          : shoppingUnavailable ? null : <ShoppingListWorkspace items={shoppingItems} />}
      </div>
    </div>
  );
}
