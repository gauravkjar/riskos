"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import type { AllocationLine } from "@/lib/engine/types";

const PALETTE = ["#3fd9c7", "#6ee7db", "#e8a94a", "#e5697a", "#8b909a", "#5f636c"];

export function AllocationChart({ lines }: { lines: AllocationLine[] }) {
  return (
    <PieChart width={220} height={220}>
      <Pie
        data={lines}
        dataKey="percent"
        nameKey="category"
        cx="50%"
        cy="50%"
        innerRadius={55}
        outerRadius={95}
        stroke="none"
        paddingAngle={2}
      >
        {lines.map((_, i) => (
          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          background: "#131519",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 8,
          fontSize: 12,
        }}
      />
    </PieChart>
  );
}
