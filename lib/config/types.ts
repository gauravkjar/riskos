export interface WeightsConfig {
  modelVersion: string;
  source: string;
  capacityWeights: { horizon: number; income: number };
  stageBlend: { stage1: number; stage2: number };
  neutralToleranceAnchor: number;
  questionScores: {
    horizon: Record<string, number>;
    drawdownReaction: Record<string, number>;
    incomeStability: Record<string, number>;
  };
  trustFactor: Record<string, number>;
  liquidityCap: Record<string, number>;
}

export interface BandDefinition {
  code: string;
  label: string;
  min: number;
  max: number;
}

export interface BandsConfig {
  modelVersion: string;
  source: string;
  bands: BandDefinition[];
}

export interface AllocationLine {
  category: string;
  percent: number;
}

export interface AllocationTableConfig {
  modelVersion: string;
  source: string;
  allocations: Record<string, AllocationLine[]>;
}

export interface PortfolioSizeRulesConfig {
  modelVersion: string;
  source: string;
  availableBasketSizesByBand: Record<string, number[]>;
  defaultBasketSizeByBand: Record<string, number>;
}

export interface EngineConfig {
  version: string;
  savedAt: string;
  weights: WeightsConfig;
  bands: BandsConfig;
  allocationTable: AllocationTableConfig;
  portfolioSizeRules: PortfolioSizeRulesConfig;
}
