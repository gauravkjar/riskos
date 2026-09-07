import weights from "./weights.json";
import bands from "./bands.json";
import allocationTable from "./allocation-table.json";
import portfolioSizeRules from "./portfolio-size-rules.json";
import type {
  AllocationTableConfig,
  BandsConfig,
  EngineConfig,
  PortfolioSizeRulesConfig,
  WeightsConfig,
} from "./types";

export const defaultWeights = weights as WeightsConfig;
export const defaultBands = bands as BandsConfig;
export const defaultAllocationTable = allocationTable as AllocationTableConfig;
export const defaultPortfolioSizeRules =
  portfolioSizeRules as PortfolioSizeRulesConfig;

export const defaultEngineConfig: EngineConfig = {
  version: "1.0",
  savedAt: "2026-08-31T00:00:00.000Z",
  weights: defaultWeights,
  bands: defaultBands,
  allocationTable: defaultAllocationTable,
  portfolioSizeRules: defaultPortfolioSizeRules,
};
