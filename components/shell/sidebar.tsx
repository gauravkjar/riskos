"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, systemNav, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex flex-col rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent/[0.08] text-foreground"
                : "text-muted hover:bg-white/[0.03] hover:text-foreground"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
            )}
            <span className="font-medium tracking-tight">{item.label}</span>
            <span className="text-xs text-muted-2">{item.description}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_var(--accent)]" />
        <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground">
          RISKOS
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <NavGroup items={primaryNav} pathname={pathname} />
        <div>
          <div className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-2">
            Governance
          </div>
          <NavGroup items={systemNav} pathname={pathname} />
        </div>
      </nav>

      <div className="mt-4 border-t border-border px-3 pt-4 text-[11px] text-muted-2">
        <div className="flex items-center justify-between">
          <span>Engine</span>
          <span className="tabular text-accent">v1.0</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Status</span>
          <span className="flex items-center gap-1.5 text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live
          </span>
        </div>
      </div>
    </aside>
  );
}
