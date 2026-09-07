import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "warn" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-accent/10 text-accent-strong border-accent/20",
  warn: "bg-warn/10 text-warn border-warn/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  neutral: "bg-white/[0.04] text-muted border-border-strong",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
