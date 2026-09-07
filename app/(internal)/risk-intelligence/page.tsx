import { Suspense } from "react";
import { RiskIntelligenceView } from "@/components/risk-intelligence/risk-intelligence-view";

export default function RiskIntelligencePage() {
  return (
    <Suspense fallback={null}>
      <RiskIntelligenceView />
    </Suspense>
  );
}
