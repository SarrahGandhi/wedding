// Use a stable, unique order in the query so page boundaries do not skip rows.
export async function allRows<T>(query: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Unable to load all records.");
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}
