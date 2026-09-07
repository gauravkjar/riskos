import type {
  BandCode,
  RiskScoreResult,
  Stage1Answers,
  Stage2Answers,
} from "@/lib/engine/types";
import type { EquitySuitabilityResult } from "@/lib/engine/equity-suitability";
import type { AllocationLine } from "@/lib/engine/types";

export type AgentStatus = "pending" | "running" | "done" | "skipped" | "error";

export interface AgentTraceStep {
  agent:
    | "Intake"
    | "Risk Scoring"
    | "Horizon & Capacity"
    | "Equity Suitability"
    | "Allocation"
    | "Portfolio Construction"
    | "Fund Intelligence"
    | "Explanation";
  status: AgentStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: string;
}

export interface RiskRun {
  id: string;
  createdAt: string;
  modelVersion: string;
  stage1: Stage1Answers;
  stage2: Stage2Answers | null;
  basketSize: number;
  score: RiskScoreResult;
  equitySuitability: EquitySuitabilityResult;
  allocationKey: string;
  allocationLines: AllocationLine[];
  fundCount: number;
  trace: AgentTraceStep[];
  explanation: string | null;
}

export type BandCodeExport = BandCode;
