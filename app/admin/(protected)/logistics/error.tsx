"use client";

import { Button } from "@/app/shared/Button";

export default function LogisticsError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="space-y-4 py-8">
      <h1 className="font-display text-3xl">Logistics could not be loaded.</h1>
      <p className="text-sm text-text-secondary">Try again to load the latest travel and accommodation details.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
