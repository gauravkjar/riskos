export type NavItem = {
  label: string;
  href: string;
  description: string;
};

export const primaryNav: NavItem[] = [
  { label: "Overview", href: "/", description: "Command center" },
  { label: "Risk Profiler", href: "/profiler", description: "Questionnaire intake" },
  { label: "Risk Intelligence", href: "/risk-intelligence", description: "Score & drivers" },
  { label: "Portfolio Engine", href: "/portfolio", description: "Allocation & construction" },
  { label: "Portfolio Simulator", href: "/simulator", description: "Scenario stress test" },
  { label: "Fund Intelligence", href: "/funds", description: "Fund-level research" },
];

export const systemNav: NavItem[] = [
  { label: "Agent Control Room", href: "/control-room", description: "Execution trace" },
  { label: "Model Configuration", href: "/model-config", description: "Versioned weights" },
  { label: "Audit Log", href: "/audit-log", description: "Reproducible runs" },
];
