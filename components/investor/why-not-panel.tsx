"use client";

import { useState } from "react";

export function WhyNotPanel({
  moreAggressive,
  moreConservative,
}: {
  moreAggressive: string;
  moreConservative: string;
}) {
  const [open, setOpen] = useState<"aggressive" | "conservative" | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(open === "aggressive" ? null : "aggressive")}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          Why not more aggressive?
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === "conservative" ? null : "conservative")}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          Why not more conservative?
        </button>
      </div>
      {open ? (
        <p className="mt-4 rounded-md border border-border bg-surface-raised p-4 text-sm text-muted">
          {open === "aggressive" ? moreAggressive : moreConservative}
        </p>
      ) : null}
    </div>
  );
}
