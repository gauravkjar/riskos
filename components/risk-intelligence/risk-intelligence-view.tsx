"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { ScoreGauge } from "./score-gauge";
import { useLatestRun, useRuns } from "@/lib/store/use-runs";
import { updateRun } from "@/lib/store/runs-store";
import { explainRun } from "@/lib/agents/explanation";

const BAND_LABEL: Record<string, string> = {
  VC: "Very Conservative",
  C: "Conservative",
  M: "Moderate",
  MA: "Moderately Aggressive",
  A: "Aggressive",
};

export function RiskIntelligenceView() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");
  const runs = useRuns();
  const latest = useLatestRun();
  const run = (runId ? runs.find((r) => r.id === runId) : undefined) ?? latest;
  const [explanation, setExplanation] = useState<string | null>(run?.explanation ?? null);
  const [loading, setLoading] = useState(false);

  if (!run) {
    return (
      <>
        <Topbar title="Risk Intelligence" subtitle="Score & drivers" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Panel className="max-w-md text-center">
            <p className="text-sm text-muted">
              No profile has been run yet.{" "}
              <Link href="/profiler" className="text-accent-strong hover:underline">
                Start the Risk Profiler
              </Link>{" "}
              to see a live result here.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const { score, equitySuitability } = run;

  function handleExplain() {
    setLoading(true);
    const text = explainRun(run!);
    updateRun(run!.id, { explanation: text });
    setExplanation(text);
    setLoading(false);
  }

  return (
    <>
      <Topbar title="Risk Intelligence" subtitle={`Run ${run.id.slice(0, 12)} — model v${run.modelVersion}`} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel className="flex flex-col items-center justify-center lg:col-span-1">
            <ScoreGauge score={run.score.finalScore} band={run.score.band} />
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={run.score.confidence === "High" ? "accent" : "warn"}>
                {BAND_LABEL[score.band]} · {run.score.confidence} confidence
              </Badge>
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader eyebrow="Formula chain" title="Where the score came from" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Ccap1" value={score.ccap1} />
              <Stat label="Tol1" value={score.tol1} />
              <Stat label="Stage 1" value={score.stage1Score} tone="accent" />
              <Stat label="Final" value={score.finalScore} tone="accent" />
            </div>
            {run.stage2 && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <Stat label="Ccap2" value={score.ccap2 ?? "—"} />
                <Stat label="Tol2" value={score.tol2 ?? "—"} />
                <Stat label="Stage 2" value={score.stage2Score ?? "—"} />
                <Stat label="Confidence" value={run.score.confidence} />
              </div>
            )}
            <p className="mt-4 text-[11px] text-muted-2">
              Non-compensatory: Stage 1 score = MIN(Capacity, Tolerance){run.stage2 ? "; Stage 2 tightens capacity via liquidity cap and shrinks tolerance via an experience trust factor — it can only pull the score down or leave it unchanged, never up." : "."}
            </p>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader eyebrow="Derived view" title="Equity suitability" />
            <Badge tone={equitySuitability.verdict === "ELIGIBLE" ? "accent" : "neutral"} className="mb-3">
              {equitySuitability.verdict.replace("_", " ")} · {equitySuitability.confidencePercent}%
            </Badge>
            <ul className="space-y-2 text-[13px] text-muted">
              {equitySuitability.drivers.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-2">—</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-2">
              Model Question: the source engine has no standalone equity-suitability score — this
              is a labeled UI-layer view over Stage 1/2 outputs, not a new input.
            </p>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Explanation Agent"
              title="Why this result"
              action={
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={loading}
                  className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong hover:bg-accent/15 disabled:opacity-50"
                >
                  {explanation ? "Regenerate" : "Explain"}
                </button>
              }
            />
            {explanation ? (
              <div className="space-y-3 text-[13px] leading-relaxed text-muted whitespace-pre-line">
                {explanation}
              </div>
            ) : (
              <p className="text-sm text-muted-2">
                Generate a narrative explanation of this already-computed result — the agent only
                reads the numbers above, it never recalculates them.
              </p>
            )}
          </Panel>
        </div>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground">Ready to see the allocation and fund breakdown?</p>
            <p className="text-[13px] text-muted-2">Allocation key {run.allocationKey} · {run.fundCount} funds</p>
          </div>
          <Link
            href={`/portfolio?run=${run.id}`}
            className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
          >
            View Portfolio Engine →
          </Link>
        </Panel>
      </div>
    </>
  );
}
