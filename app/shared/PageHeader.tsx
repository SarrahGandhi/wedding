import type { ReactNode } from "react";

export function PageHeader({
  chapter,
  title,
  meta,
}: {
  chapter?: string;
  title: string;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-10 flex items-end justify-between flex-wrap gap-4">
      <div>
        {chapter && (
          <p className="text-xs tracking-[0.4em] uppercase text-accent font-body mb-2">
            {chapter}
          </p>
        )}
        <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
          {title}
        </h1>
      </div>
      {meta && (
        <div className="text-xs tracking-[0.25em] uppercase text-text-secondary font-body tabular-nums">
          {meta}
        </div>
      )}
    </header>
  );
}
