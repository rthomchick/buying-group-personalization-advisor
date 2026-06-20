// Half-screen Advisory panel opened from step card — preserves workflow state
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — "'Ask Advisor' opens inline
// Advisory panel. Half-screen right panel. Step card remains fully visible
// and interactive on the left. Guided Workflow state is fully preserved."
//
// This is a panel overlay, not a modal — it never unmounts or covers the
// StepCard; closing it only flips isOpen, owned by app/guided/page.tsx, which
// never touches workflowState. PT-1 (Classification State Diagnosis) is used
// for every in-workflow query — the brief names it the most relevant problem
// type for configuration-time questions, since onboarding steps are largely
// CLIENT_ATTRIBUTE_MAP/classification inputs.
//
// "Full Advisory Mode quality — not a degraded inline version": this panel
// renders the real AdvisoryChat (which composes the real DiagnosticOutput),
// not a re-implementation. AdvisoryChat's initialValue prop pre-populates the
// step-context text edit ably, same as the standalone Advisory Mode page.

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AdvisoryChat } from "@/components/advisory/AdvisoryChat";
import type { ParsedAdvisoryOutput } from "@/lib/advisory/output-parser";

export type InlineAdvisoryStepContext = {
  stepId: number;
  stepTitle: string;
  corpusAuthority: string;
  attribute: string;
};

export type InlineAdvisoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  stepContext: InlineAdvisoryStepContext;
  onQueryResult?: (output: ParsedAdvisoryOutput) => void;
};

const INLINE_ADVISORY_PROBLEM_TYPE = "PT-1" as const;

function buildPrepopulatedContext(stepContext: InlineAdvisoryStepContext): string {
  return `I am on Step ${stepContext.stepId} (${stepContext.stepTitle}), configuring ${stepContext.attribute}. Corpus authority: ${stepContext.corpusAuthority}.`;
}

export function InlineAdvisoryPanel({ isOpen, onClose, stepContext, onQueryResult }: InlineAdvisoryPanelProps) {
  const [output, setOutput] = useState<ParsedAdvisoryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A new step's "Ask Advisor" click should start from a fresh pre-population,
  // not the previous step's leftover diagnosis.
  useEffect(() => {
    setOutput(null);
    setError(null);
  }, [stepContext.stepId]);

  async function handleSubmit(userContext: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemType: INLINE_ADVISORY_PROBLEM_TYPE,
          userContext: { description: userContext },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Advisory request failed (${response.status}).`);
      }

      const data: { parsed: ParsedAdvisoryOutput } = await response.json();
      setOutput(data.parsed);
      onQueryResult?.(data.parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutput(null);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-background shadow-2xl sm:w-[480px] lg:w-[560px]"
      role="complementary"
      aria-label="Inline Advisor panel"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Ask Advisor</span>
          <span className="font-mono text-xs text-kalder-accent">
            Step {stepContext.stepId} — {stepContext.stepTitle}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close Advisor panel">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="mb-3 rounded-md border border-kalder-hold/40 bg-kalder-hold/[0.08] px-3 py-2 text-sm text-kalder-hold">
            {error}
          </div>
        )}

        <AdvisoryChat
          key={stepContext.stepId}
          problemType={INLINE_ADVISORY_PROBLEM_TYPE}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          output={output}
          initialValue={buildPrepopulatedContext(stepContext)}
        />
      </div>
    </div>
  );
}
