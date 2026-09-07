"use client";

import { PieChart, Pie, Cell } from "recharts";
import type { BandCode } from "@/lib/engine/types";

const BAND_COLOR: Record<BandCode, string> = {
  VC: "#3fd9c7",
  C: "#3fd9c7",
  M: "#e8a94a",
  MA: "#e8a94a",
  A: "#e5697a",
};

export function ScoreGauge({ score, band }: { score: number; band: BandCode }) {
  const data = [
    { name: "score", value: score },
    { name: "rest", value: 100 - score },
  ];
  const color = BAND_COLOR[band];

  return (
    <div className="relative flex items-center justify-center">
      <PieChart width={200} height={120}>
        <Pie
          data={data}
          cx={100}
          cy={100}
          startAngle={180}
          endAngle={0}
          innerRadius={70}
          outerRadius={90}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="rgba(255,255,255,0.06)" />
        </Pie>
      </PieChart>
      <div className="absolute top-[52px] flex flex-col items-center">
        <span className="tabular text-3xl font-semibold text-foreground">{score}</span>
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted-2">/ 100</span>
      </div>
    </div>
  );
}
