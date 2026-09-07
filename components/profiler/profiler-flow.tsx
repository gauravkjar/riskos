"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "./question-card";
import {
  stage1Questions,
  stage2Questions,
} from "@/lib/engine/questions";
import type {
  DrawdownAnswer,
  ExperienceAnswer,
  HorizonAnswer,
  IncomeAnswer,
  LiquidityAnswer,
} from "@/lib/engine/types";
import { runRiskEngine } from "@/lib/orchestrator/run";
import { saveRun } from "@/lib/store/runs-store";
import { useEngineConfig } from "@/lib/store/use-config";

type Step =
  | { kind: "stage1"; index: number }
  | { kind: "stage2-prompt" }
  | { kind: "stage2"; index: number }
  | { kind: "submitting" };

interface Answers {
  horizon: HorizonAnswer | null;
  drawdownReaction: DrawdownAnswer | null;
  incomeStability: IncomeAnswer | null;
  experience: ExperienceAnswer | null;
  liquidity: LiquidityAnswer | null;
}

const EMPTY: Answers = {
  horizon: null,
  drawdownReaction: null,
  incomeStability: null,
  experience: null,
  liquidity: null,
};

export function ProfilerFlow() {
  const router = useRouter();
  const config = useEngineConfig();
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [step, setStep] = useState<Step>({ kind: "stage1", index: 0 });

  const totalSteps = 5;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );

  function submit(finalAnswers: Answers, includeStage2: boolean) {
    setStep({ kind: "submitting" });
    const run = runRiskEngine(
      {
        horizon: finalAnswers.horizon!,
        drawdownReaction: finalAnswers.drawdownReaction!,
        incomeStability: finalAnswers.incomeStability!,
      },
      includeStage2
        ? {
            experience: finalAnswers.experience!,
            liquidity: finalAnswers.liquidity!,
          }
        : null,
      undefined,
      config
    );
    saveRun(run);
    router.push(`/risk-intelligence?run=${run.id}`);
  }

  if (step.kind === "stage1") {
    const q = stage1Questions[step.index];
    const value = answers[q.id];
    return (
      <ProfilerShell progress={step.index} total={totalSteps} answeredCount={answeredCount}>
        <QuestionCard
          prompt={q.prompt}
          context={q.context}
          options={q.options}
          value={value}
          onSelect={(v) => {
            const next = { ...answers, [q.id]: v };
            setAnswers(next);
            if (step.index < stage1Questions.length - 1) {
              setStep({ kind: "stage1", index: step.index + 1 });
            } else {
              setStep({ kind: "stage2-prompt" });
            }
          }}
        />
      </ProfilerShell>
    );
  }

  if (step.kind === "stage2-prompt") {
    return (
      <ProfilerShell progress={3} total={totalSteps} answeredCount={answeredCount}>
        <Panel className="max-w-xl text-center">
          <Badge tone="accent" className="mx-auto mb-4">
            Stage 1 complete
          </Badge>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Answer 2 more questions for a higher-confidence result?
          </h2>
          <p className="mt-2 text-[13px] text-muted-2">
            Stage 2 can only tighten your capacity ceiling and shrink an inexperienced
            investor&apos;s stated tolerance toward a neutral midpoint — it never loosens
            Stage 1. Skipping gives a Medium-confidence result from Stage 1 alone.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => submit(answers, false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-border-strong hover:text-foreground"
            >
              Skip — use Medium confidence
            </button>
            <button
              type="button"
              onClick={() => setStep({ kind: "stage2", index: 0 })}
              className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
            >
              Continue to Stage 2
            </button>
          </div>
        </Panel>
      </ProfilerShell>
    );
  }

  if (step.kind === "stage2") {
    const q = stage2Questions[step.index];
    const value = answers[q.id];
    return (
      <ProfilerShell progress={3 + step.index} total={totalSteps} answeredCount={answeredCount}>
        <QuestionCard
          prompt={q.prompt}
          context={q.context}
          options={q.options}
          value={value}
          onSelect={(v) => {
            const next = { ...answers, [q.id]: v };
            setAnswers(next);
            if (step.index < stage2Questions.length - 1) {
              setStep({ kind: "stage2", index: step.index + 1 });
            } else {
              submit(next, true);
            }
          }}
        />
      </ProfilerShell>
    );
  }

  return (
    <ProfilerShell progress={5} total={totalSteps} answeredCount={5}>
      <Panel className="max-w-xl text-center">
        <p className="text-sm text-muted">Running Risk Scoring, Capacity and Allocation agents…</p>
      </Panel>
    </ProfilerShell>
  );
}

function ProfilerShell({
  progress,
  total,
  answeredCount,
  children,
}: {
  progress: number;
  total: number;
  answeredCount: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar title="Risk Profiler" subtitle="Conversational intake" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-8">
        <div className="flex w-full max-w-xl items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < progress || i < answeredCount ? "bg-accent/70" : "bg-white/[0.06]"
              )}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={progress}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
