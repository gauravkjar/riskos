"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLatestRun, useRuns } from "@/lib/store/use-runs";
import type { AgentStatus } from "@/lib/orchestrator/types";

const STATUS_TONE: Record<AgentStatus, "accent" | "warn" | "neutral" | "danger"> = {
  done: "accent",
  running: "warn",
  pending: "neutral",
  skipped: "neutral",
  error: "danger",
};

export function ControlRoomView() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run");
  const runs = useRuns();
  const latest = useLatestRun();
  const run = (runId ? runs.find((r) => r.id === runId) : undefined) ?? latest;

  if (!run) {
    return (
      <>
        <Topbar title="Agent Control Room" subtitle="Execution trace" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Panel className="max-w-md text-center">
            <p className="text-sm text-muted">
              No orchestrator run yet.{" "}
              <Link href="/profiler" className="text-accent-strong hover:underline">
                Start the Risk Profiler
              </Link>{" "}
              to see a live agent trace.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Agent Control Room" subtitle={`Run ${run.id.slice(0, 12)}`} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel>
          <PanelHeader eyebrow="Pipeline" title="Intake → Scoring → Capacity → Equity → Allocation → Portfolio → Explanation" />
          <div className="flex flex-wrap items-center gap-2">
            {run.trace.map((step, i) => (
              <div key={step.agent} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border px-3 py-2.5 text-center",
                    step.status === "done" && "border-accent/30 bg-accent/[0.06]",
                    step.status === "skipped" && "border-border bg-white/[0.01] opacity-50",
                    step.status === "pending" && "border-warn/20 bg-warn/[0.04]"
                  )}
                >
                  <span className="text-xs font-medium text-foreground">{step.agent}</span>
                  <Badge tone={STATUS_TONE[step.status]}>{step.status}</Badge>
                </div>
                {i < run.trace.length - 1 && <span className="text-muted-2">→</span>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Trace" title="Live execution log" />
          <div className="space-y-0 divide-y divide-border">
            {run.trace.map((step) => (
              <div key={step.agent} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <span className="tabular w-20 shrink-0 pt-0.5 text-[11px] text-muted-2">
                  {step.durationMs > 0 ? `${step.durationMs}ms` : "—"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{step.agent}</span>
                    <Badge tone={STATUS_TONE[step.status]}>{step.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{step.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
