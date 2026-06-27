"use client";

import { useSyncExternalStore } from "react";

const WEDDING_DATE = new Date("2026-10-22T00:00:00").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(now: number): TimeLeft {
  const diff = WEDDING_DATE - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

// Quantize to whole seconds so consecutive snapshots within the same tick
// return the same value (useSyncExternalStore relies on referential stability).
function getSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot() {
  return 0;
}

const TILES = [
  { label: "Days", tile: "bg-blush text-rose", tilt: "-rotate-2" },
  { label: "Hours", tile: "bg-mint text-leaf", tilt: "rotate-1" },
  { label: "Minutes", tile: "bg-sky text-bluebell", tilt: "-rotate-1" },
  {
    label: "Seconds",
    tile: "bg-peach text-tangerine",
    tilt: "rotate-2",
    hideOnMobile: true,
  },
];

function Digit({
  value,
  label,
  tile,
  tilt,
  hideOnMobile,
}: {
  value: number;
  label: string;
  tile: string;
  tilt: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div className={`${hideOnMobile ? "hidden sm:flex" : "flex"} min-w-0`}>
      <span
        className={`${tile} ${tilt} inline-flex items-baseline gap-2 rounded-2xl border border-white/70 px-3 py-2.5 shadow-[0_12px_28px_-14px_rgba(90,80,90,0.4)] transition-transform duration-300 hover:rotate-0 hover:scale-105 sm:rounded-3xl sm:px-4 sm:py-3`}
      >
        <span className="font-display display-wonk text-3xl leading-none sm:text-4xl">
          {/* Fraunces digits are proportional; fixed-width cells keep the tile
              from resizing as the numbers tick over. */}
          {String(value)
            .padStart(2, "0")
            .split("")
            .map((digit, i) => (
              <span key={i} className="inline-block w-[0.64em] text-center">
                {digit}
              </span>
            ))}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] font-body sm:tracking-[0.22em]">
          {label}
        </span>
      </span>
    </div>
  );
}

export function Countdown() {
  const nowSeconds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const time =
    nowSeconds === 0
      ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
      : getTimeLeft(nowSeconds * 1000);
  const values = [time.days, time.hours, time.minutes, time.seconds];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {TILES.map((t, i) => (
        <Digit key={t.label} value={values[i]} {...t} />
      ))}
    </div>
  );
}
