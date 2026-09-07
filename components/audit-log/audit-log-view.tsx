"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useRuns } from "@/lib/store/use-runs";
import { computeRiskScore } from "@/lib/engine/risk-scoring";
import { defaultEngineConfig } from "@/lib/config/defaults";

export function AuditLogView() {
  const runs = useRuns();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <Topbar title="Audit Log" subtitle="Reproducible runs" />
      <div className="flex-1 space-y-4 overflow-y-auto p-6 md:p-8">
        {runs.length === 0 ? (
          <Panel className="text-center">
            <p className="text-sm text-muted">
              No runs recorded yet.{" "}
              <Link href="/profiler" className="text-accent-strong hover:underline">
                Start the Risk Profiler
              </Link>{" "}
              to create the first audit entry.
            </p>
          </Panel>
        ) : (
          runs.map((run) => {
            const isOpen = expanded === run.id;
            const replay = computeRiskScore(
              run.stage1,
              run.stage2 ?? undefined,
              defaultEngineConfig.weights,
              defaultEngineConfig.bands
            );
            const reproducible = replay.finalScore === run.score.finalScore && replay.band === run.score.band;

            return (
              <Panel key={run.id}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : run.id)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="tabular text-sm font-medium text-foreground">{run.id}</span>
                      <Badge tone="neutral">v{run.modelVersion}</Badge>
                      <Badge tone={run.score.confidence === "High" ? "accent" : "warn"}>
                        {run.score.band} · {run.score.finalScore}
                      </Badge>
                      {reproducible ? (
                        <Badge tone="accent">Reproducible</Badge>
                      ) : (
                        <Badge tone="danger">Diverges from current defaults</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-2">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-muted-2">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4 text-[13px]">
                    <div>
                      <PanelHeader eyebrow="Raw inputs" title="Answers" />
                      <pre className="overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-muted">
                        {JSON.stringify({ stage1: run.stage1, stage2: run.stage2 }, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <PanelHeader eyebrow="Intermediate scores" title="Engine output" />
                      <pre className="overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-muted">
                        {JSON.stringify(run.score, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <PanelHeader eyebrow="Allocation" title={`${run.allocationKey} · ${run.fundCount} funds`} />
                      <pre className="overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-muted">
                        {JSON.stringify(run.allocationLines, null, 2)}
                      </pre>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/risk-intelligence?run=${run.id}`}
                        className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong hover:bg-accent/15"
                      >
                        Open in Risk Intelligence
                      </Link>
                      <Link
                        href={`/control-room?run=${run.id}`}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-foreground"
                      >
                        View agent trace
                      </Link>
                    </div>
                  </div>
                )}
              </Panel>
            );
          })
        )}
      </div>
    </>
  );
}
