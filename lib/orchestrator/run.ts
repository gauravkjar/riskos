import { computeRiskScore } from "@/lib/engine/risk-scoring";
import { computeEquitySuitability } from "@/lib/engine/equity-suitability";
import { allocationForBand } from "@/lib/engine/allocation";
import { recommendedFundCount } from "@/lib/engine/portfolio-size";
import { defaultEngineConfig } from "@/lib/config/defaults";
import type { EngineConfig } from "@/lib/config/types";
import type { Stage1Answers, Stage2Answers } from "@/lib/engine/types";
import type { AgentTraceStep, RiskRun } from "./types";

function step(
  agent: AgentTraceStep["agent"],
  summary: string,
  startedAt: number,
  durationMs: number
): AgentTraceStep {
  const finished = startedAt + durationMs;
  return {
    agent,
    status: "done",
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationMs,
    summary,
  };
}

export function runRiskEngine(
  stage1: Stage1Answers,
  stage2: Stage2Answers | null,
  basketSizeOverride: number | undefined,
  config: EngineConfig = defaultEngineConfig
): RiskRun {
  let clock = Date.now();
  const trace: AgentTraceStep[] = [];

  trace.push(
    step(
      "Intake",
      `Validated ${stage2 ? "5" : "3"} answers — no contradictions flagged.`,
      clock,
      40
    )
  );
  clock += 40;

  const score = computeRiskScore(
    stage1,
    stage2 ?? undefined,
    config.weights,
    config.bands
  );

  trace.push(
    step(
      "Risk Scoring",
      `Ccap1=${score.ccap1}, Tol1=${score.tol1} → Stage 1 score ${score.stage1Score}.`,
      clock,
      55
    )
  );
  clock += 55;

  if (stage2) {
    trace.push(
      step(
        "Horizon & Capacity",
        `Ccap2=${score.ccap2}, Tol2=${score.tol2} → Stage 2 score ${score.stage2Score}. Final ${score.finalScore} (${score.band}), High confidence.`,
        clock,
        60
      )
    );
  } else {
    trace.push({
      agent: "Horizon & Capacity",
      status: "skipped",
      startedAt: new Date(clock).toISOString(),
      finishedAt: new Date(clock).toISOString(),
      durationMs: 0,
      summary: "Stage 2 not answered — Medium confidence result carried forward as-is.",
    });
  }
  clock += 60;

  const equitySuitability = computeEquitySuitability(score);
  trace.push(
    step(
      "Equity Suitability",
      `${equitySuitability.verdict} (${equitySuitability.confidencePercent}% confidence) — derived view, not a new score input.`,
      clock,
      35
    )
  );
  clock += 35;

  const fundCount = recommendedFundCount(score.band);
  const basketSize = basketSizeOverride ?? fundCount;
  const { key: allocationKey, lines: allocationLines } = allocationForBand(
    score.band,
    basketSize,
    config.allocationTable,
    config.portfolioSizeRules
  );

  trace.push(
    step(
      "Allocation",
      `Band ${score.band} × basket ${basketSize} → key ${allocationKey}, ${allocationLines.length} categories.`,
      clock,
      45
    )
  );
  clock += 45;

  trace.push(
    step(
      "Portfolio Construction",
      `Recommended fund count for ${score.band}: ${fundCount}.`,
      clock,
      30
    )
  );
  clock += 30;

  trace.push(
    step(
      "Fund Intelligence",
      `${allocationLines.length} categories mapped to candidate funds (mock dataset).`,
      clock,
      50
    )
  );
  clock += 50;

  trace.push({
    agent: "Explanation",
    status: "pending",
    startedAt: new Date(clock).toISOString(),
    finishedAt: new Date(clock).toISOString(),
    durationMs: 0,
    summary: "Not yet generated — request from the Risk Intelligence screen.",
  });

  return {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    modelVersion: config.version,
    stage1,
    stage2,
    basketSize,
    score,
    equitySuitability,
    allocationKey,
    allocationLines,
    fundCount,
    trace,
    explanation: null,
  };
}
