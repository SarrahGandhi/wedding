import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import type { Task } from "@/lib/tasks";
import { PageHeader } from "@/app/shared/PageHeader";
import { TasksWorkspace } from "./TasksWorkspace";

export const metadata: Metadata = { title: "Tasks | Murtaza & Sarrah" };

export default async function TasksPage() {
  const { supabase } = await requireAdmin();
  const tasks: Task[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("tasks").select("*")
      .order("completed").order("due_date").order("id").range(offset, offset + 999);
    if (error) {
      return <div>
        <PageHeader title="Tasks." />
        <p role="alert" className="rounded-2xl bg-blush/50 p-6 text-rose">
          Tasks could not be loaded. Please refresh the page or try again shortly.
        </p>
      </div>;
    }
    tasks.push(...data);
    if (data.length < 1000) break;
  }
  return <TasksWorkspace tasks={tasks} />;
}
