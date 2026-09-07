"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { RiskAssessment } from "@/lib/db/schema";

type DetailRecord = RiskAssessment & { userEmail: string };

export function ProfileDetail({ id }: { id: string }) {
  const [record, setRecord] = useState<DetailRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/internal/profiles/${id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load assessment.");
        return body as DetailRecord;
      })
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <>
        <Topbar title="Assessment" subtitle={id} />
        <div className="p-8">
          <Panel>
            <p className="text-sm text-danger">{error}</p>
          </Panel>
        </div>
      </>
    );
  }

  if (!record) {
    return (
      <>
        <Topbar title="Assessment" subtitle={id} />
        <div className="p-8">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </>
    );
  }

  const { run } = record;

  return (
    <>
      <Topbar
        title={record.userEmail}
        subtitle={`Assessment ${record.id.slice(0, 12)} · v${record.version} · ${record.status}`}
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Badge tone={record.status === "active" ? "accent" : "neutral"}>{record.status}</Badge>
          <Badge tone="neutral">{run.score.band}</Badge>
          <Badge tone="neutral">Model v{run.modelVersion}</Badge>
          <Badge tone={run.score.confidence === "High" ? "accent" : "warn"}>
            {run.score.confidence} confidence
          </Badge>
          <Link
            href={`/control-room?assessmentId=${record.id}`}
            className="ml-auto rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-foreground"
          >
            View agent trace
          </Link>
        </div>

        <Panel>
          <PanelHeader eyebrow="Raw & normalized inputs" title="Answers" />
          <pre className="tabular overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-muted">
            {JSON.stringify(record.answers, null, 2)}
          </pre>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Score breakdown" title={`Final score ${run.score.finalScore}`} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Ccap1" value={run.score.ccap1} />
            <Field label="Tol1" value={run.score.tol1} />
            <Field label="Stage1 score" value={run.score.stage1Score} />
            <Field label="Ccap2" value={run.score.ccap2 ?? "—"} />
            <Field label="Tol2" value={run.score.tol2 ?? "—"} />
            <Field label="Stage2 score" value={run.score.stage2Score ?? "—"} />
            <Field label="Final score" value={run.score.finalScore} />
            <Field label="Band" value={run.score.band} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="Equity suitability"
            title={`${run.equitySuitability.verdict} (${run.equitySuitability.confidencePercent}% confidence)`}
          />
          <ul className="list-inside list-disc space-y-1 text-[13px] text-muted">
            {run.equitySuitability.drivers.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Allocation" title={`${run.allocationKey} · ${run.allocationLines.length} categories`} />
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-2">
                <th className="py-1.5 pr-4 font-medium">Category</th>
                <th className="py-1.5 pr-4 font-medium">Percent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {run.allocationLines.map((line) => (
                <tr key={line.category}>
                  <td className="py-1.5 pr-4 text-foreground">{line.category}</td>
                  <td className="tabular py-1.5 pr-4 text-muted">{line.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Portfolio" title={`Basket size ${run.basketSize} · ${run.fundCount} recommended funds`} />
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Agent trace" title="Execution record" />
          <div className="space-y-0 divide-y divide-border">
            {run.trace.map((step) => (
              <div key={step.agent} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <span className="tabular w-20 shrink-0 pt-0.5 text-[11px] text-muted-2">
                  {step.durationMs > 0 ? `${step.durationMs}ms` : "—"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{step.agent}</span>
                    <Badge tone={step.status === "done" ? "accent" : step.status === "skipped" ? "neutral" : "warn"}>
                      {step.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{step.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Explanation" title="Generated narrative" />
          <p className="text-[13px] text-muted">
            {run.explanation ?? "Not yet generated for this run."}
          </p>
        </Panel>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.1em] text-muted-2">{label}</span>
      <span className="tabular text-sm text-foreground">{value}</span>
    </div>
  );
}
