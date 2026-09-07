import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  suffix,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: "accent" | "default";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] uppercase tracking-[0.1em] text-muted-2">{label}</span>
      <span
        className={cn(
          "tabular text-2xl font-semibold tracking-tight",
          tone === "accent" ? "text-accent-strong" : "text-foreground"
        )}
      >
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-muted">{suffix}</span>}
      </span>
    </div>
  );
}
