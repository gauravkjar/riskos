"use client";

import Link from "next/link";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { useRuns } from "@/lib/store/use-runs";
import { useEngineConfig } from "@/lib/store/use-config";

const flow = [
  { label: "Input", detail: "5-question intake" },
  { label: "Risk", detail: "Capacity × Tolerance" },
  { label: "Capacity", detail: "Liquidity / trust" },
  { label: "Allocation", detail: "Band × basket size" },
  { label: "Portfolio", detail: "Fund categories" },
];

const BAND_ORDER = ["VC", "C", "M", "MA", "A"] as const;
const BAND_LABEL: Record<string, string> = {
  VC: "Very Conservative",
  C: "Conservative",
  M: "Moderate",
  MA: "Moderately Aggressive",
  A: "Aggressive",
};

export default function OverviewPage() {
  const runs = useRuns();
  const config = useEngineConfig();

  const total = runs.length;
  const avgScore = total
    ? Math.round((runs.reduce((s, r) => s + r.score.finalScore, 0) / total) * 10) / 10
    : null;
  const highConfidenceCount = runs.filter((r) => r.score.confidence === "High").length;
  const confidencePct = total ? Math.round((highConfidenceCount / total) * 100) : null;

  const bandCounts = BAND_ORDER.map((code) => ({
    code,
    label: BAND_LABEL[code],
    count: runs.filter((r) => r.score.band === code).length,
  }));
  const bandDistribution = bandCounts.map((b) => ({
    ...b,
    pct: total ? Math.round((b.count / total) * 100) : 0,
  }));

  return (
    <>
      <Topbar title="Command Center" subtitle="Risk intelligence engine — live status" />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel className="relative overflow-hidden">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-2">
                Risk Intelligence
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                <span className="tabular text-accent-strong">{total}</span>
                <span className="text-sm font-normal text-muted">profiles analysed</span>
                <span className="text-muted-2">→</span>
                <span className="tabular text-foreground">5</span>
                <span className="text-sm font-normal text-muted">risk bands</span>
                <span className="text-muted-2">→</span>
                <span className="text-sm font-normal text-muted">portfolio recommendation</span>
              </div>
            </div>
            <Badge tone="accent">Engine v{config.version} · Calibrated</Badge>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {flow.map((step) => (
              <div key={step.label} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-full items-center justify-center rounded-md border border-border bg-white/[0.02] text-sm font-medium text-foreground">
                  {step.label}
                </div>
                <span className="mt-2 text-[11px] text-muted-2">{step.detail}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Panel>
            <Stat label="Profiles analysed" value={total} />
          </Panel>
          <Panel>
            <Stat label="Average risk score" value={avgScore ?? "—"} />
          </Panel>
          <Panel>
            <Stat label="High confidence" value={confidencePct !== null ? confidencePct : "—"} suffix={confidencePct !== null ? "%" : undefined} />
          </Panel>
          <Panel>
            <Stat label="Exceptions" value={0} tone="accent" />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader eyebrow="Distribution" title="Risk band spread" />
            {total === 0 ? (
              <p className="text-sm text-muted-2">
                No profiles run yet.{" "}
                <Link href="/profiler" className="text-accent-strong hover:underline">
                  Start the Risk Profiler
                </Link>{" "}
                to populate this chart.
              </p>
            ) : (
              <div className="space-y-3">
                {bandDistribution.map((band) => (
                  <div key={band.code} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 font-mono text-xs text-muted-2">{band.code}</span>
                    <span className="w-40 shrink-0 truncate text-sm text-muted">{band.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-accent/70"
                        style={{ width: `${band.pct}%` }}
                      />
                    </div>
                    <span className="tabular w-10 text-right text-xs text-muted-2">{band.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-[11px] text-muted-2">
              Live distribution across all profiles run in this browser session.
            </p>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Governance" title="Engine status" />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Engine version</dt>
                <dd className="tabular text-foreground">v{config.version}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Last calibration</dt>
                <dd className="tabular text-foreground">MF_Risk_Engine.xlsx</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Scoring basis</dt>
                <dd className="text-foreground">Deterministic, non-compensatory</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Agents online</dt>
                <dd className="tabular text-accent-strong">8 / 8</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
