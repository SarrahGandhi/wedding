export const flowCategories = ["Timeline", "Clothes", "Shoes", "Jewellery", "Required items", "Menu"] as const;
export const flowSides = ["BRIDE", "GROOM", "BOTH"] as const;
export type FlowCategory = typeof flowCategories[number];
export type FlowSide = typeof flowSides[number];
export type FlowEntry = {
  id: number; event_id: number; side: FlowSide; category: FlowCategory;
  title: string; time: string | null; owner: string | null; notes: string | null;
  completed: boolean; revision: number;
};
export type FlowEvent = { id: number; name: string; date: string; time: string; location: string | null };
export const sideLabels: Record<FlowSide, string> = { BRIDE: "Bride side", GROOM: "Groom side", BOTH: "Shared" };

export function parseFlowEntry(form: FormData) {
  const event_id = Number(form.get("event_id"));
  const title = String(form.get("title") ?? "").trim();
  const side = String(form.get("side")) as FlowSide;
  const category = String(form.get("category")) as FlowCategory;
  const time = String(form.get("time") ?? "").trim() || null;
  const owner = String(form.get("owner") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  if (!Number.isSafeInteger(event_id) || event_id <= 0) return { error: "Select an event." };
  if (!flowSides.includes(side) || !flowCategories.includes(category)) return { error: "Select a valid side and category." };
  if (!title || title.length > 200) return { error: "Enter a name of up to 200 characters." };
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "Enter a valid time." };
  if ((owner?.length ?? 0) > 120 || (notes?.length ?? 0) > 4000) return { error: "Keep the person’s name under 120 characters and notes under 4,000 characters." };
  return { data: { event_id, title, side, category, time, owner, notes } };
}

export function compareFlowEntries(a: FlowEntry, b: FlowEntry) {
  return (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.id - b.id;
}
