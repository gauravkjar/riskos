import { Suspense } from "react";
import { SimulatorView } from "@/components/simulator/simulator-view";

export default function SimulatorPage() {
  return (
    <Suspense fallback={null}>
      <SimulatorView />
    </Suspense>
  );
}
