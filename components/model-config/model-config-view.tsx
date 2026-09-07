"use client";

import { useState } from "react";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useEngineConfig } from "@/lib/store/use-config";
import { getConfigHistory, resetEngineConfig, saveEngineConfig } from "@/lib/store/config-store";

export function ModelConfigView() {
  const config = useEngineConfig();
  const [horizonWeight, setHorizonWeight] = useState(config.weights.capacityWeights.horizon);
  const [stage1Weight, setStage1Weight] = useState(config.weights.stageBlend.stage1);
  const [dirty, setDirty] = useState(false);
  const history = getConfigHistory();

  function updateHorizon(value: number) {
    setHorizonWeight(value);
    setDirty(true);
  }
  function updateStage1(value: number) {
    setStage1Weight(value);
    setDirty(true);
  }

  function handleSave() {
    const next = {
      weights: {
        ...config.weights,
        capacityWeights: { horizon: horizonWeight, income: Math.round((1 - horizonWeight) * 100) / 100 },
        stageBlend: { stage1: stage1Weight, stage2: Math.round((1 - stage1Weight) * 100) / 100 },
      },
      bands: config.bands,
      allocationTable: config.allocationTable,
      portfolioSizeRules: config.portfolioSizeRules,
    };
    saveEngineConfig(next);
    setDirty(false);
  }

  function handleReset() {
    resetEngineConfig();
    setDirty(false);
  }

  return (
    <>
      <Topbar title="Model Configuration" subtitle={`Versioned weights & rules — v${config.version}`} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
        <Panel>
          <PanelHeader
            eyebrow="Governance"
            title="Weight configuration"
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-foreground"
                >
                  Reset to shipped defaults
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty}
                  className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong hover:bg-accent/15 disabled:opacity-40"
                >
                  Save (bumps version)
                </button>
              </div>
            }
          />

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Capacity weight — Horizon</span>
                <span className="tabular text-muted">
                  {horizonWeight.toFixed(2)} / {(1 - horizonWeight).toFixed(2)} Income
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={horizonWeight}
                onChange={(e) => updateHorizon(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="mt-1 text-[11px] text-muted-2">
                Ccap1 = Horizon × {horizonWeight.toFixed(2)} + Income × {(1 - horizonWeight).toFixed(2)}.
                Shipped default: 0.70 / 0.30 (Sheet 3, cells C7/C8).
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground">Stage blend — Stage 1</span>
                <span className="tabular text-muted">
                  {stage1Weight.toFixed(2)} / {(1 - stage1Weight).toFixed(2)} Stage 2
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={stage1Weight}
                onChange={(e) => updateStage1(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="mt-1 text-[11px] text-muted-2">
                Final = Stage1 × {stage1Weight.toFixed(2)} + Stage2 × {(1 - stage1Weight).toFixed(2)} when
                Stage 2 is answered. Shipped default: 0.65 / 0.35 (Sheet 3, cells C13/C14).
              </p>
            </div>
          </div>

          {dirty && (
            <Badge tone="warn" className="mt-4">
              Unsaved changes — saving bumps the model version, nothing mutates silently
            </Badge>
          )}
        </Panel>

        <Panel>
          <PanelHeader eyebrow="History" title="Version history" />
          <div className="space-y-2">
            {[...history].reverse().map((h) => (
              <div key={h.version + h.savedAt} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                <span className="tabular text-foreground">v{h.version}</span>
                <span className="tabular text-xs text-muted-2">{new Date(h.savedAt).toLocaleString()}</span>
                <span className="text-xs text-muted">
                  H:{h.weights.capacityWeights.horizon} / S1:{h.weights.stageBlend.stage1}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Read-only" title="Allocation table & band cutoffs" />
          <p className="text-[13px] text-muted">
            The 13-row allocation table and 5 band cutoffs (Sheets 5 &amp; 7) are ported verbatim
            from the source workbook and are not editable in this build — only the two blend
            weights above are exposed as tunable parameters, matching the ported engine&apos;s
            documented configuration surface.
          </p>
        </Panel>
      </div>
    </>
  );
}
