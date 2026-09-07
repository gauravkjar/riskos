"use client";

import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { QuestionOption } from "@/lib/engine/questions";

export function QuestionCard<T extends string>({
  prompt,
  context,
  options,
  value,
  onSelect,
}: {
  prompt: string;
  context: string;
  options: QuestionOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <Panel className="max-w-xl">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{prompt}</h2>
      <p className="mt-1.5 text-[13px] text-muted-2">{context}</p>
      <div className="mt-6 flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "rounded-md border px-4 py-3 text-left text-sm transition-colors",
              value === opt.value
                ? "border-accent/40 bg-accent/10 text-accent-strong"
                : "border-border bg-white/[0.015] text-foreground hover:border-border-strong hover:bg-white/[0.03]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Panel>
  );
}
