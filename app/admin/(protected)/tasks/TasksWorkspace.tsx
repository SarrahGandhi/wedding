"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { PageHeader } from "@/app/shared/PageHeader";
import { formatTaskDate, TASK_SIDE_LABELS, type Task, type TaskSide } from "@/lib/tasks";
import { saveTask, setTaskCompleted } from "./actions";

const buttonStyle = "rounded-full px-5 py-3 !tracking-[0.08em]";
const fieldStyle = "rounded-xl !tracking-normal";

function useTaskAction(action: typeof saveTask) {
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
        setError("The change could not be confirmed. Refresh the page to check the task before trying again.");
      }
    });
  }
  return { pending, error, run };
}

function TaskForm({ task, owners, defaultSide, onClose, onSaved }: {
  task?: Task;
  owners: string[];
  defaultSide: TaskSide;
  onClose: () => void;
  onSaved: (side: TaskSide) => void;
}) {
  // Keep the revision paired with the values the admin actually opened.
  const [initial] = useState(task);
  const [side, setSide] = useState<TaskSide>(initial?.side ?? defaultSide);
  const ownerListId = useId();
  const save = useTaskAction(saveTask);

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
        <FormField label="Task name" name="name" required maxLength={160} defaultValue={initial?.name}
          placeholder="Confirm the wedding menu" className={fieldStyle} labelClassName="sm:col-span-2 [&_span]:!tracking-[0.08em]" autoFocus />
        <FormField label="Owner" name="owner" required maxLength={120} defaultValue={initial?.owner}
          placeholder="Who is responsible?" list={ownerListId} className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]" />
        <datalist id={ownerListId}>{owners.map((owner) => <option key={owner} value={owner} />)}</datalist>
        <FormField label="Due date" name="due_date" type="date" required min="0001-01-01" max="9999-12-31"
          defaultValue={initial?.due_date} className={`${fieldStyle} min-w-0`} labelClassName="min-w-0 [&_span]:!tracking-[0.08em]" />
        <SelectField label="Side" name="side" required value={side}
          onChange={(event) => setSide(event.target.value as TaskSide)}
          className={fieldStyle} labelClassName="[&_span]:!tracking-[0.08em]">
          <option value="BRIDE">Bride side</option>
          <option value="GROOM">Groom side</option>
        </SelectField>
        <label className="flex items-center gap-3 text-base">
          <input type="checkbox" name="completed" defaultChecked={initial?.completed ?? false} className="h-5 w-5 accent-sage" />
          Complete
        </label>
      </fieldset>
      {save.error && <p role="alert" className="text-sm text-rose">{save.error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" pending={save.pending} className={buttonStyle}>
          {save.pending ? "Saving…" : initial ? "Save changes" : "Add task"}
        </Button>
        <Button variant="secondary" disabled={save.pending} onClick={onClose} className={buttonStyle}>Cancel</Button>
      </div>
    </form>
  );
}

function TaskItem({ task, owners, onSaved }: {
  task: Task;
  owners: string[];
  onSaved: (message: string, side?: TaskSide) => void;
}) {
  const [editing, setEditing] = useState(false);
  const status = useTaskAction(setTaskCompleted);

  return (
    <li className="min-w-0 rounded-2xl border border-border/60 bg-warm-white p-5 sm:p-6">
      {editing ? <>
        <h3 className="mb-5 font-display text-2xl">Edit task</h3>
        <TaskForm task={task} owners={owners} defaultSide={task.side} onClose={() => setEditing(false)} onSaved={(side) => {
          setEditing(false);
          onSaved("Task updated.", side);
        }} />
      </> : <>
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <h3 className={`break-words text-lg font-medium ${task.completed ? "text-text-secondary line-through" : "text-foreground"}`}>{task.name}</h3>
            <label className={`mt-3 inline-flex cursor-pointer items-center gap-3 text-sm ${task.completed ? "text-sage" : "text-text-secondary"}`}>
              <input type="checkbox" checked={task.completed} disabled={status.pending}
                aria-label={`Mark ${task.name} ${task.completed ? "incomplete" : "complete"}`}
                className="h-5 w-5 accent-sage disabled:opacity-50" onChange={(event) => {
                  const completed = event.target.checked;
                  const form = new FormData();
                  form.set("id", String(task.id));
                  form.set("revision", String(task.revision));
                  form.set("completed", String(completed));
                  status.run(form, () => onSaved(completed ? "Task marked complete." : "Task reopened."));
                }} />
              {status.pending ? "Saving…" : task.completed ? "Complete" : "Incomplete"}
            </label>
          </div>
          <dl className="min-w-0"><dt className="mb-1 text-sm text-text-secondary">Owner</dt><dd className="break-words">{task.owner}</dd></dl>
          <dl><dt className="mb-1 text-sm text-text-secondary">Due date</dt><dd className="tabular-nums"><time dateTime={task.due_date}>{formatTaskDate(task.due_date)}</time></dd></dl>
          <Button variant="secondary" className={`${buttonStyle} justify-self-start`} disabled={status.pending}
            aria-label={`Edit ${task.name}`} onClick={() => setEditing(true)}>Edit</Button>
        </div>
        {status.error && <p role="alert" className="mt-4 text-sm text-rose">{status.error}</p>}
      </>}
    </li>
  );
}

export function TasksWorkspace({ tasks }: { tasks: Task[] }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "incomplete" | "complete">("all");
  const [notice, setNotice] = useState("");
  const [side, setSide] = useState<TaskSide>("BRIDE");
  const sideTasks = tasks.filter((task) => task.side === side);
  const completedCount = sideTasks.filter((task) => task.completed).length;
  const owners = [...new Set(tasks.map((task) => task.owner))].sort();
  const filtered = sideTasks.filter((task) => filter === "all" || task.completed === (filter === "complete"));

  return (
    <div className="space-y-7 font-body leading-[1.45] [font-kerning:normal]">
      <PageHeader title="Tasks." meta={`${completedCount} of ${sideTasks.length} complete`} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-base text-text-secondary">Keep track of what needs doing, who owns it, and when it’s due.</p>
        <Button className={buttonStyle} onClick={() => setAdding(true)} disabled={adding}>Add task</Button>
      </div>
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1.5" role="group" aria-label="Filter tasks by side">
        {(["BRIDE", "GROOM"] as const).map((value) => <button key={value} type="button"
          aria-pressed={side === value} disabled={adding}
          onClick={() => { setSide(value); setNotice(""); }}
          className={`cursor-pointer rounded-xl px-5 py-3 text-base font-medium transition-colors disabled:cursor-default ${side === value
            ? value === "BRIDE" ? "bg-blush text-rose" : "bg-sky text-bluebell"
            : "text-text-secondary hover:bg-powder"}`}>
          {TASK_SIDE_LABELS[value]}
        </button>)}
      </div>
      <p role="status" className={notice ? "rounded-xl bg-sage-light px-5 py-3 text-sm text-sage" : "sr-only"}>{notice}</p>
      {adding && <section aria-labelledby="add-task-heading" className="rounded-2xl border border-accent/40 bg-warm-white p-5 sm:p-7">
        <h2 id="add-task-heading" className="mb-6 font-display text-3xl">Add a task</h2>
        <TaskForm owners={owners} defaultSide={side} onClose={() => setAdding(false)} onSaved={(savedSide) => {
          setAdding(false);
          setSide(savedSide);
          setFilter("all");
          setNotice("Task added.");
        }} />
      </section>}
      <section aria-labelledby="task-list-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 id="task-list-heading" className="font-display text-3xl">{TASK_SIDE_LABELS[side]} tasks</h2>
          {sideTasks.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tasks by status">
            {(["all", "incomplete", "complete"] as const).map((value) => <button key={value} type="button"
              aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-colors ${filter === value ? "bg-foreground text-warm-white" : "bg-warm-white text-text-secondary hover:bg-cream"}`}>
              {value === "all" ? "All" : value === "complete" ? "Complete" : "Incomplete"}
            </button>)}
          </div>}
        </div>
        {sideTasks.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-6 py-10">
          <h3 className="mb-2 font-display text-2xl">No tasks for the {side === "BRIDE" ? "bride" : "groom"} side yet.</h3>
          <p className="max-w-prose text-base text-text-secondary">Add a task for this side, assign an owner, and choose a due date.</p>
        </div> : filtered.length === 0 ? <p className="py-6 text-base text-text-secondary">No {filter} tasks. Choose another filter to see the rest.</p>
          : <ul className="space-y-3">{filtered.map((task) => <TaskItem key={task.id} task={task} owners={owners} onSaved={(message, savedSide) => {
            setNotice(message);
            if (savedSide) setSide(savedSide);
          }} />)}</ul>}
      </section>
    </div>
  );
}
