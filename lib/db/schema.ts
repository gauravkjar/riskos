import type { Role } from "@/lib/auth/types";
import type { RiskRun } from "@/lib/orchestrator/types";
import type { Stage1Answers, Stage2Answers } from "@/lib/engine/types";
import type { EngineConfig } from "@/lib/config/types";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface InvestorProfile {
  id: string;
  userId: string;
  displayName: string;
  createdAt: string;
}

export type RiskAssessmentStatus = "active" | "superseded";

/**
 * A single point-in-time risk assessment for a profile. Wraps the existing
 * orchestrator RiskRun output verbatim (untouched engine logic) plus the raw
 * answers that produced it. Phase 1 deliberately embeds the run's internal
 * breakdown (score, equity suitability, allocation lines, trace, etc.)
 * inside this one record rather than modelling them as separate tables
 * (QuestionnaireResponse / RiskScore / RiskBand / EquityAssessment /
 * AllocationRecommendation / PortfolioRecommendation / FundRecommendation /
 * Simulation / ModelVersion / AgentExecution). That normalization can happen
 * in a later phase if/when those need independent querying or history.
 */
export interface RiskAssessment {
  id: string;
  userId: string;
  profileId: string;
  version: number;
  createdAt: string;
  answers: {
    stage1: Stage1Answers;
    stage2: Stage2Answers | null;
  };
  run: RiskRun;
  status: RiskAssessmentStatus;
}

export interface AuditEvent {
  id: string;
  userId: string | null;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/**
 * A saved, versioned snapshot of the engine config. Never overwritten —
 * saving always appends a new row with a bumped `config.version`. The most
 * recently saved row is the one live investor assessments should use.
 */
export interface ModelConfigVersion {
  id: string;
  version: string;
  savedAt: string;
  savedByUserId: string;
  config: EngineConfig;
}

export interface Database {
  users: User[];
  profiles: InvestorProfile[];
  assessments: RiskAssessment[];
  auditEvents: AuditEvent[];
  modelConfigVersions: ModelConfigVersion[];
}
