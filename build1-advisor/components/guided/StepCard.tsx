// Five-zone step card — title/authority, Why This Matters, HOLDs, FLAGs,
// input zone, controls
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md, "Guided
// Workflow Mode: Step Card Specification" — display order is HOLD cards above
// FLAG cards, always; FLAG cards render only once all HOLDs on the step are
// resolved; "Next Step" is disabled (locked, not just grayed) while any HOLD
// is active — this mirrors state-machine.ts's canAdvance()/advanceToNextStep()
// guard, it does not replace it.

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, ArrowLeft, ArrowRight, MessageCircleQuestion } from "lucide-react";
import { HoldCard } from "./HoldCard";
import { FlagCard } from "./FlagCard";
import { DeferralDropdown } from "./DeferralDropdown";
import { DeferralCounter } from "./DeferralCounter";
import type { WorkflowStepDefinition, StepSubmission } from "@/lib/guided/flag-hold-evaluator";
import type { GuidedWorkflowState, DeferralOption } from "@/lib/session/session-state";

export type StepCardProps = {
  step: WorkflowStepDefinition;
  state: GuidedWorkflowState;
  totalSteps: number;
  onAdvance: (stepInput: StepSubmission) => void;
  onResolveHold: (holdId: string, resolutionText: string) => void;
  onAcknowledgeFlag: (flagId: string) => void;
  onDefer: (reason: Exclude<DeferralOption, "cancel_deferral">) => void;
  onAskAdvisor: () => void;
  onPrevious?: () => void;
};

export function StepCard({
  step,
  state,
  totalSteps,
  onAdvance,
  onResolveHold,
  onAcknowledgeFlag,
  onDefer,
  onAskAdvisor,
  onPrevious,
}: StepCardProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const activeHolds = state.activeHolds.filter((h) => h.stepId === step.step_id);
  const activeFlags = state.activeFlags.filter((f) => f.stepId === step.step_id);
  const hasActiveHolds = activeHolds.length > 0;

  function handleNext() {
    if (hasActiveHolds) return;
    const submission: StepSubmission = { value: inputValue.trim().length > 0 ? inputValue.trim() : null };
    onAdvance(submission);
  }

  return (
    <Card className="bg-surface">
      {/* Zone 1: title + corpus authority */}
      <CardHeader className="flex flex-col gap-1 border-b border-border pb-4">
        <span className="text-sm font-semibold text-foreground">
          Step {step.step_id} of {totalSteps} — {step.step_title}
        </span>
        <span className="font-mono text-xs text-kalder-accent">Corpus authority: {step.corpus_authority}</span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {/* Zone 2: Why This Matters */}
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why This Matters</h4>
          <p className="text-sm leading-relaxed text-foreground">{step.why_this_matters}</p>
        </section>

        {/* Zone 3: HOLD cards — only if active */}
        {hasActiveHolds && (
          <section className="flex flex-col gap-2">
            {activeHolds.map((hold) => (
              <HoldCard key={hold.holdCode} hold={hold} onResolve={onResolveHold} />
            ))}
          </section>
        )}

        {/* Zone 4: FLAG cards — only once all HOLDs on this step are resolved */}
        {!hasActiveHolds && activeFlags.length > 0 && (
          <section className="flex flex-col gap-2">
            {activeFlags.map((flag) => (
              <FlagCard key={flag.flagCode} flag={flag} onAcknowledge={onAcknowledgeFlag} />
            ))}
          </section>
        )}

        {/* Zone 5: input zone */}
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</h4>
          {step.validation_type === "mapping_table" || step.validation_type === "enum" ? (
            <Select onValueChange={setInputValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={step.input_required} />
              </SelectTrigger>
              <SelectContent>
                {(step.allowed_values ?? []).map((value) => (
                  <SelectItem key={String(value)} value={String(value)}>
                    {String(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={step.input_required}
            />
          )}
        </section>
      </CardContent>

      {/* Controls footer */}
      <div className="flex flex-col gap-3 border-t border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onPrevious && (
              <Button variant="ghost" size="sm" onClick={onPrevious}>
                <ArrowLeft className="size-4" />
                Previous
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onAskAdvisor}>
              <MessageCircleQuestion className="size-4" />
              Ask Advisor
            </Button>
            {step.render_deferral_control !== false && (
              <DeferralDropdown onDefer={onDefer} consequence={step.deferral_consequence} />
            )}
          </div>

          <div className="flex items-center gap-3">
            <DeferralCounter count={state.deferralLog.filter((d) => d.stepId === step.step_id).length} />
            <Button onClick={handleNext} disabled={hasActiveHolds} variant={hasActiveHolds ? "secondary" : "default"}>
              {hasActiveHolds && <Lock className="size-4" />}
              Next Step
              {!hasActiveHolds && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
