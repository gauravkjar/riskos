"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { AllocationChart } from "./allocation-chart";
import { useLatestRun, useRuns } from "@/lib/store/use-runs";
import { availableBasketSizes } from "@/lib/engine/allocation";
import { allocationForBand } from "@/lib/engine/allocation";
import { updateRun } from "@/lib/store/runs-store";
import { useEngineConfig } from "@/lib/store/use-config";

const PALETTE = ["#3fd9c7", "#6ee7db", "#e8a94a", "#e5697a", "#8b909a", "#5f636c"];

export function PortfolioView() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");
  const runs = useRuns();
  const latest = useLatestRun();
  const run = (runId ? runs.find((r) => r.id === runId) : undefined) ?? latest;
  const config = useEngineConfig();

  if (!run) {
    return (
      <>
        <Topbar title="Portfolio Engine" subtitle="Allocation & construction" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Panel className="max-w-md text-center">
            <p className="text-sm text-muted">
              No profile has been run yet.{" "}
              <Link href="/profiler" className="text-accent-strong hover:underline">
                Start the Risk Profiler
              </Link>{" "}
              first.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const sizes = availableBasketSizes(run.score.band, config.portfolioSizeRules);

  function handleResize(size: number) {
    if (!run) return;
    const { key, lines } = allocationForBand(
      run.score.band,
      size,
      config.allocationTable,
      config.portfolioSizeRules
    );
    updateRun(run.id, { basketSize: size, allocationKey: key, allocationLines: lines, fundCount: size });
  }

  return (
    <>
      <Topbar title="Portfolio Engine" subtitle={`${run.score.band} band · ${run.allocationKey}`} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel className="flex flex-col items-center justify-center lg:col-span-1">
            <AllocationChart lines={run.allocationLines} />
            <Badge tone="accent" className="mt-3">
              {run.allocationKey}
            </Badge>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader
              eyebrow="Allocation Agent"
              title="Category breakdown"
              action={
                <div className="flex gap-1.5">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleResize(size)}
                      className={`rounded-md border px-2.5 py-1 text-xs ${
                        run.basketSize === size
                          ? "border-accent/40 bg-accent/10 text-accent-strong"
                          : "border-border text-muted hover:border-border-strong"
                      }`}
                    >
                      {size} funds
                    </button>
                  ))}
                </div>
              }
            />
            <div className="space-y-2.5">
              {run.allocationLines.map((line, i) => (
                <div key={line.category} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="w-44 shrink-0 truncate text-sm text-foreground">{line.category}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${line.percent}%`, background: PALETTE[i % PALETTE.length] }}
                    />
                  </div>
                  <span className="tabular w-10 text-right text-xs text-muted-2">{line.percent}%</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-muted-2">
              Fixed row from the ported allocation table (MF_Risk_Engine.xlsx Sheet 7) — categories
              and percentages are not re-derived, only looked up by band × basket size.
            </p>
          </Panel>
        </div>

        <Panel className="border-warn/20 bg-warn/[0.04]">
          <PanelHeader eyebrow="Compliance" title="Model Question — SEBI RIA/RA boundary" />
          <p className="text-[13px] text-muted">
            Showing specific allocation percentages may constitute a &ldquo;model portfolio&rdquo;
            under SEBI IA Regulations Reg 2(1)(l), which can cross from MFD (Mutual Fund
            Distributor) into RIA/RA (Registered Investment Adviser) territory. Flagged verbatim
            from the source workbook (Sheet 0 ReadMe &amp; Compliance, Sheet 8 cell F19) — surfaced
            here rather than silently ignored or silently blocked.
          </p>
        </Panel>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground">See how this allocation behaves under market stress?</p>
          </div>
          <Link
            href={`/simulator?run=${run.id}`}
            className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
          >
            Open Portfolio Simulator →
          </Link>
        </Panel>
      </div>
    </>
  );
}
