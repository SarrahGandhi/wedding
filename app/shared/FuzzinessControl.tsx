"use client";

export const DEFAULT_FUZZINESS = 0.2;

export function FuzzinessControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block w-full max-w-md">
      <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1 flex items-baseline justify-between">
        <span>Match strictness</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={0.6}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <span className="flex justify-between text-[10px] tracking-[0.2em] uppercase text-muted font-body">
        <span>Exact</span>
        <span>Loose</span>
      </span>
    </label>
  );
}
