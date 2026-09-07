"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { ProfileListRow } from "@/app/api/internal/profiles/route";

export function ProfileExplorer() {
  const [rows, setRows] = useState<ProfileListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/internal/profiles")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load profiles.");
        return body as ProfileListRow[];
      })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load profiles.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.userEmail, r.band, r.status, r.equityVerdict, r.allocationKey, r.modelVersion]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  return (
    <>
      <Topbar title="Profile Explorer" subtitle="All investor assessments across the platform" />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel>
          <PanelHeader
            eyebrow="Directory"
            title={`${filtered.length}${rows ? ` of ${rows.length}` : ""} assessments`}
            action={
              <input
                type="text"
                placeholder="Search email, band, status…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 rounded-md border border-border bg-white/[0.02] px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent/40"
              />
            }
          />

          {error && <p className="text-sm text-danger">{error}</p>}
          {!error && !rows && <p className="text-sm text-muted">Loading…</p>}
          {!error && rows && rows.length === 0 && (
            <p className="text-sm text-muted">
              No assessments yet. Register/log in as an investor and complete the questionnaire.
            </p>
          )}

          {!error && rows && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-2">
                    <th className="py-2 pr-4 font-medium">Investor</th>
                    <th className="py-2 pr-4 font-medium">Created</th>
                    <th className="py-2 pr-4 font-medium">Ver</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Score</th>
                    <th className="py-2 pr-4 font-medium">Band</th>
                    <th className="py-2 pr-4 font-medium">Equity</th>
                    <th className="py-2 pr-4 font-medium">Allocation</th>
                    <th className="py-2 pr-4 font-medium">Funds</th>
                    <th className="py-2 pr-4 font-medium">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.assessmentId} className="hover:bg-white/[0.02]">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/profiles/${r.assessmentId}`}
                          className="text-accent-strong hover:underline"
                        >
                          {r.userEmail}
                        </Link>
                      </td>
                      <td className="tabular py-2 pr-4 text-muted">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="tabular py-2 pr-4 text-muted">v{r.version}</td>
                      <td className="py-2 pr-4">
                        <Badge tone={r.status === "active" ? "accent" : "neutral"}>{r.status}</Badge>
                      </td>
                      <td className="tabular py-2 pr-4 text-foreground">{r.finalScore}</td>
                      <td className="py-2 pr-4">
                        <Badge tone="neutral">{r.band}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={r.equityVerdict === "ELIGIBLE" ? "accent" : "warn"}>
                          {r.equityVerdict}
                        </Badge>
                      </td>
                      <td className="tabular py-2 pr-4 text-muted">{r.allocationKey}</td>
                      <td className="tabular py-2 pr-4 text-muted">{r.fundCount}</td>
                      <td className="tabular py-2 pr-4 text-muted-2">v{r.modelVersion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
