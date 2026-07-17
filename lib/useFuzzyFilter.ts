"use client";

import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo } from "react";

// Callers must pass a stable `options` reference (module-scope constant),
// otherwise the Fuse index is rebuilt on every render.
export function useFuzzyFilter<T>(
  items: T[],
  search: string,
  options: IFuseOptions<T>,
  threshold?: number,
): T[] {
  const fuse = useMemo(
    () =>
      new Fuse(
        items,
        threshold === undefined ? options : { ...options, threshold },
      ),
    [items, options, threshold],
  );

  return useMemo(() => {
    const query = search.trim();
    if (!query) return items;
    return fuse.search(query).map((result) => result.item);
  }, [fuse, items, search]);
}
