import type { Database } from "./supabase/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskSide = Task["side"];

export const TASK_SIDE_LABELS: Record<TaskSide, string> = {
  BRIDE: "Bride side",
  GROOM: "Groom side",
};

export function parseTask(form: FormData):
  | { error: string; data?: never }
  | { data: Pick<Task, "name" | "owner" | "due_date" | "completed" | "side">; error?: never } {
  const name = form.get("name");
  const owner = form.get("owner");
  const dueDate = form.get("due_date");
  const completed = form.get("completed");
  const side = form.get("side");

  if (side !== "BRIDE" && side !== "GROOM") {
    return { error: "Choose bride side or groom side." };
  }

  if (typeof name !== "string" || !name.trim() || name.trim().length > 160) {
    return { error: "Enter a task name of up to 160 characters." };
  }
  if (typeof owner !== "string" || !owner.trim() || owner.trim().length > 120) {
    return { error: "Enter an owner name of up to 120 characters." };
  }
  // Round-trip the calendar date to reject dates such as February 30.
  if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    || dueDate < "0001-01-01"
    || !Number.isFinite(Date.parse(`${dueDate}T00:00:00Z`))
    || new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== dueDate) {
    return { error: "Choose a valid due date." };
  }
  if (completed !== null && completed !== "on") {
    return { error: "Choose a valid completion status." };
  }
  return { data: { name: name.trim(), owner: owner.trim(), due_date: dueDate, completed: completed === "on", side } };
}

export function taskIdentity(form: FormData) {
  const id = Number(form.get("id"));
  const revision = Number(form.get("revision"));
  return Number.isSafeInteger(id) && id > 0 && Number.isSafeInteger(revision) && revision > 0
    ? { id, revision } : null;
}

export function formatTaskDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
