"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { useLatestRun, useRuns } from "@/lib/store/use-runs";
import { simulatePortfolio } from "@/lib/engine/simulator";

export function SimulatorView() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");
  const runs = useRuns();
  const latest = useLatestRun();
  const run = (runId ? runs.find((r) => r.id === runId) : undefined) ?? latest;
  const [amount, setAmount] = useState(1000000);

  const result = useMemo(
    () => (run ? simulatePortfolio(run.allocationLines, amount) : null),
    [run, amount]
  );

  if (!run || !result) {
    return (
      <>
        <Topbar title="Portfolio Simulator" subtitle="Scenario stress test" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Panel className="max-w-md text-center">
            <p className="text-sm text-muted">
              No allocation to simulate yet.{" "}
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

  return (
    <>
      <Topbar title="Portfolio Simulator" subtitle={`${run.score.band} band · ${run.allocationKey}`} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel>
          <PanelHeader eyebrow="Input" title="Investment amount" />
          <div className="flex items-center gap-4">
            <span className="tabular text-2xl font-semibold text-foreground">
              ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={10000000}
            step={50000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-4 w-full accent-[var(--accent)]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted-2">
            <span>₹50,000</span>
            <span>₹1,00,00,000</span>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Panel>
            <Stat label="Expected 1yr return" value={result.expectedReturnPct} suffix="%" tone="accent" />
            <p className="tabular mt-2 text-sm text-muted">
              → ₹{result.expectedValueOneYear.toLocaleString("en-IN")}
            </p>
          </Panel>
          <Panel>
            <Stat label="Worst-case 1yr" value={result.worstCasePct} suffix="%" />
            <p className="tabular mt-2 text-sm text-muted">
              → ₹{result.worstCaseValueOneYear.toLocaleString("en-IN")}
            </p>
          </Panel>
          <Panel>
            <Stat label="Blended volatility" value={result.volatilityPct} suffix="%" />
          </Panel>
        </div>

        <Panel className="border-warn/20 bg-warn/[0.04]">
          <Badge tone="warn" className="mb-2">
            Illustrative only
          </Badge>
          <p className="text-[13px] text-muted">
            Return, volatility and worst-case figures are illustrative historical-scenario
            assumptions per fund category — not live market data, not a forecast, and not part of
            the ported deterministic risk-scoring engine. They exist only to stress-test the
            already-computed allocation from the Portfolio Engine.
          </p>
        </Panel>
      </div>
    </>
  );
}
