"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { stage1Questions, stage2Questions } from "@/lib/engine/questions";
import type {
  DrawdownAnswer,
  ExperienceAnswer,
  HorizonAnswer,
  IncomeAnswer,
  LiquidityAnswer,
} from "@/lib/engine/types";

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

export default function InvestorQuestionnairePage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [step, setStep] = useState<Step>({ kind: "stage1", index: 0 });
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );

  async function submit(finalAnswers: Answers, includeStage2: boolean) {
    setStep({ kind: "submitting" });
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage1: {
            horizon: finalAnswers.horizon,
            drawdownReaction: finalAnswers.drawdownReaction,
            incomeStability: finalAnswers.incomeStability,
          },
          stage2: includeStage2
            ? {
                experience: finalAnswers.experience,
                liquidity: finalAnswers.liquidity,
              }
            : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Unable to submit your answers.");
        setStep(includeStage2 ? { kind: "stage2", index: stage2Questions.length - 1 } : { kind: "stage2-prompt" });
        return;
      }
      router.push("/risk-profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setStep(includeStage2 ? { kind: "stage2", index: stage2Questions.length - 1 } : { kind: "stage2-prompt" });
    }
  }

  if (step.kind === "stage1") {
    const q = stage1Questions[step.index];
    const value = answers[q.id];
    return (
      <QuestionnaireShell progress={step.index} total={totalSteps} answeredCount={answeredCount} error={error}>
        <InvestorQuestionCard
          prompt={q.prompt}
          context={q.context}
          options={q.options}
          value={value}
          onSelect={(v) => {
            const next = { ...answers, [q.id]: v };
            setAnswers(next);
            setError(null);
            if (step.index < stage1Questions.length - 1) {
              setStep({ kind: "stage1", index: step.index + 1 });
            } else {
              setStep({ kind: "stage2-prompt" });
            }
          }}
        />
      </QuestionnaireShell>
    );
  }

  if (step.kind === "stage2-prompt") {
    return (
      <QuestionnaireShell progress={3} total={totalSteps} answeredCount={answeredCount} error={error}>
        <div className="glass-panel mx-auto max-w-xl rounded-lg p-8 text-center">
          <span className="mx-auto mb-4 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent-strong">
            Step 1 complete
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Answer 2 more questions for a higher-confidence result?
          </h2>
          <p className="mt-2 text-[13px] text-muted-2">
            A couple more questions help us fine-tune your result. You can skip this and get a
            good estimate right away.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => submit(answers, false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-border-strong hover:text-foreground"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => setStep({ kind: "stage2", index: 0 })}
              className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
            >
              Continue
            </button>
          </div>
        </div>
      </QuestionnaireShell>
    );
  }

  if (step.kind === "stage2") {
    const q = stage2Questions[step.index];
    const value = answers[q.id];
    return (
      <QuestionnaireShell progress={3 + step.index} total={totalSteps} answeredCount={answeredCount} error={error}>
        <InvestorQuestionCard
          prompt={q.prompt}
          context={q.context}
          options={q.options}
          value={value}
          onSelect={(v) => {
            const next = { ...answers, [q.id]: v };
            setAnswers(next);
            setError(null);
            if (step.index < stage2Questions.length - 1) {
              setStep({ kind: "stage2", index: step.index + 1 });
            } else {
              submit(next, true);
            }
          }}
        />
      </QuestionnaireShell>
    );
  }

  return (
    <QuestionnaireShell progress={5} total={totalSteps} answeredCount={5} error={error}>
      <div className="glass-panel mx-auto max-w-xl rounded-lg p-8 text-center">
        <p className="text-sm text-muted">Working out your risk profile…</p>
      </div>
    </QuestionnaireShell>
  );
}

function QuestionnaireShell({
  progress,
  total,
  answeredCount,
  error,
  children,
}: {
  progress: number;
  total: number;
  answeredCount: number;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-4">
      <div className="flex w-full max-w-xl items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < progress || i < answeredCount ? "bg-accent/70" : "bg-white/[0.06]"
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="w-full max-w-xl text-center text-sm text-danger">{error}</p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={progress}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InvestorQuestionCard<T extends string>({
  prompt,
  context,
  options,
  value,
  onSelect,
}: {
  prompt: string;
  context: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="glass-panel mx-auto max-w-xl rounded-lg p-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{prompt}</h2>
      <p className="mt-2 text-sm text-muted-2">{context}</p>
      <div className="mt-6 flex flex-col gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "rounded-md border px-4 py-3.5 text-left text-sm transition-colors",
              value === opt.value
                ? "border-accent/40 bg-accent/10 text-accent-strong"
                : "border-border bg-white/[0.015] text-foreground hover:border-border-strong hover:bg-white/[0.03]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
