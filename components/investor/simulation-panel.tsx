"use client";

import { useState } from "react";
import type { AllocationLine } from "@/lib/engine/types";

interface ScenarioResult {
  scenario: string;
  valueAfter: number;
  changePct: number;
}

const HORIZON_OPTIONS = [
  { value: "1", label: "1 year" },
  { value: "3", label: "3 years" },
  { value: "5", label: "5 years" },
  { value: "10", label: "10+ years" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SimulationPanel({ allocationLines }: { allocationLines: AllocationLine[] }) {
  const [amount, setAmount] = useState(100000);
  const [horizon, setHorizon] = useState("5");
  const [results, setResults] = useState<ScenarioResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to run simulation.");
      }
      setResults(data.scenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run simulation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Portfolio Simulator
        </h1>
        <p className="mt-2 text-sm text-muted">
          This reflects your recommended portfolio — the allocation isn&apos;t
          editable here, since it comes directly from your risk profile.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {allocationLines.map((line) => (
            <div
              key={line.category}
              className="flex items-center justify-between text-sm text-muted"
            >
              <span>{line.category}</span>
              <span className="tabular text-foreground">{line.percent}%</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Investment amount
            <input
              type="number"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              onBlur={runSimulation}
              className="rounded-md border border-border bg-surface-raised px-3 py-2 text-foreground outline-none focus:border-accent/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Horizon (illustrative only)
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="rounded-md border border-border bg-surface-raised px-3 py-2 text-foreground outline-none focus:border-accent/50"
            >
              {HORIZON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={runSimulation}
          disabled={loading}
          className="mt-6 rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15 disabled:opacity-50"
        >
          {loading ? "Simulating…" : "Run simulation"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      </div>

      {results ? (
        <div className="glass-panel rounded-lg p-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Scenario outcomes over {horizon} year{horizon === "1" ? "" : "s"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <div
                key={r.scenario}
                className="rounded-md border border-border bg-surface-raised p-4"
              >
                <p className="text-sm font-medium text-foreground">{r.scenario}</p>
                <p className="mt-2 font-mono text-2xl tabular text-accent-strong">
                  {formatCurrency(r.valueAfter)}
                </p>
                <p
                  className={`mt-1 text-sm tabular ${
                    r.changePct >= 0 ? "text-accent-strong" : "text-red-400"
                  }`}
                >
                  {r.changePct >= 0 ? "+" : ""}
                  {r.changePct}%
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-2">
            These figures are illustrative projections based on historical,
            simplified assumptions — they are not guaranteed and actual returns
            can differ significantly. This is not investment advice.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-lg p-8">
          <p className="text-sm text-muted-2">
            These figures, once generated, will be illustrative projections
            based on historical, simplified assumptions — not guaranteed, and
            not investment advice.
          </p>
        </div>
      )}
    </div>
  );
}
