"use client";

import { useState } from "react";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import mockFunds from "@/lib/config/mock-funds.json";

const categories = Array.from(new Set(mockFunds.funds.map((f) => f.category)));

export function FundsView() {
  const [filter, setFilter] = useState<string | null>(null);
  const funds = filter ? mockFunds.funds.filter((f) => f.category === filter) : mockFunds.funds;

  return (
    <>
      <Topbar title="Fund Intelligence" subtitle="Fund-level research" />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel>
          <PanelHeader eyebrow="Filter" title="By category" />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === null
                  ? "border-accent/40 bg-accent/10 text-accent-strong"
                  : "border-border text-muted hover:border-border-strong"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  filter === c
                    ? "border-accent/40 bg-accent/10 text-accent-strong"
                    : "border-border text-muted hover:border-border-strong"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow={`${funds.length} funds`} title="Candidate universe" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-2">
                  <th className="pb-2 pr-4 font-medium">Fund</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 text-right font-medium">Sharpe</th>
                  <th className="pb-2 pr-4 text-right font-medium">Sortino</th>
                  <th className="pb-2 pr-4 text-right font-medium">Max drawdown</th>
                  <th className="pb-2 pr-4 text-right font-medium">Expense ratio</th>
                  <th className="pb-2 text-right font-medium">AUM (₹Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {funds.map((f) => (
                  <tr key={f.name}>
                    <td className="py-2.5 pr-4 text-foreground">{f.name}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone="neutral">{f.category}</Badge>
                    </td>
                    <td className="tabular py-2.5 pr-4 text-right text-muted">{f.sharpe.toFixed(2)}</td>
                    <td className="tabular py-2.5 pr-4 text-right text-muted">{f.sortino.toFixed(2)}</td>
                    <td className="tabular py-2.5 pr-4 text-right text-danger">{f.maxDrawdown.toFixed(1)}%</td>
                    <td className="tabular py-2.5 pr-4 text-right text-muted">{f.expenseRatio.toFixed(2)}%</td>
                    <td className="tabular py-2.5 text-right text-muted">{f.aum.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] text-muted-2">
            Mock dataset for research purposes — kept structurally separate from the deterministic
            risk-scoring and allocation engine, which never references individual fund identity.
          </p>
        </Panel>
      </div>
    </>
  );
}
