// Guided Workflow view — step card renderer, FLAG/HOLD state, deferral tracker
//
// Owns all data fetching for Guided Workflow Mode. WorkflowSelector, StepCard,
// and CompletionScreen receive only props — none of them call fetch() itself.
//
// talDomain gap: GuidedWorkflowState has no field that stores submitted step
// values (state-machine.ts only tracks holds/flags/statuses, never the raw
// submitted value) — there is no way to read "what was entered for step 1"
// back out of GuidedWorkflowState alone. Tracked here as page-local state
// (submittedStepValues), separate from the locked GuidedWorkflowState shape,
// capturing each step's stepInput.value as it's submitted.

"use client";

import { useState } from "react";
import { WorkflowSelector } from "@/components/guided/WorkflowSelector";
import { StepCard } from "@/components/guided/StepCard";
import { CompletionScreen } from "@/components/guided/CompletionScreen";
import { InlineAdvisoryPanel, type InlineAdvisoryStepContext } from "@/components/guided/InlineAdvisoryPanel";
import type { GuidedWorkflowState, WorkflowId, DeferralOption, HoldRecord } from "@/lib/session/session-state";
import type { WorkflowStepDefinition, StepSubmission } from "@/lib/guided/flag-hold-evaluator";

type GuidedApiResponse = {
  guidedWorkflowState: GuidedWorkflowState;
  workflowSteps?: WorkflowStepDefinition[];
  firedHolds?: unknown[];
  firedFlags?: unknown[];
};

type GuidedApiError = { error: string; activeHolds?: HoldRecord[] };

// "advance" is the only action that can come back 409 (HoldBlocksAdvancementError).
// The route's 409 body is { error, activeHolds } — no guidedWorkflowState, since
// advanceToNextStep() throws before producing a next state. The page must still
// surface those holds in StepCard, so this merges them into the current
// workflowState locally rather than discarding them as a generic error.

export default function GuidedPage() {
  const [workflowState, setWorkflowState] = useState<GuidedWorkflowState | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepDefinition[]>([]);
  const [submittedStepValues, setSubmittedStepValues] = useState<Record<number, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineAdvisoryOpen, setInlineAdvisoryOpen] = useState(false);
  const [inlineAdvisoryStepContext, setInlineAdvisoryStepContext] = useState<InlineAdvisoryStepContext | null>(null);

  async function postGuidedAction(body: Record<string, unknown>): Promise<GuidedApiResponse | GuidedApiError | null> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/guided", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Non-bypassable HOLD — not a generic failure. Caller decides how to
          // surface activeHolds; this is expected control flow, not an error path.
          return data as GuidedApiError;
        }
        const errBody = data as GuidedApiError;
        throw new Error(errBody.error ?? `Guided Workflow request failed (${response.status}).`);
      }

      return data as GuidedApiResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function isHoldBlockedResponse(data: GuidedApiResponse | GuidedApiError): data is GuidedApiError {
    return "activeHolds" in data;
  }

  async function handleSelectWorkflow(workflowId: WorkflowId) {
    const data = await postGuidedAction({ action: "initWorkflow", guidedWorkflowState: null, workflowId });
    if (!data || isHoldBlockedResponse(data)) return;
    setWorkflowState(data.guidedWorkflowState);
    setWorkflowSteps(data.workflowSteps ?? []);
  }

  async function handleAdvance(stepInput: StepSubmission) {
    if (!workflowState) return;
    setSubmittedStepValues((prev) => ({ ...prev, [workflowState.currentStep]: stepInput.value }));

    const data = await postGuidedAction({ action: "advance", guidedWorkflowState: workflowState, stepInput });
    if (!data) return;

    if (isHoldBlockedResponse(data)) {
      // Merge the fired holds into the current step locally — the route's 409
      // body carries no guidedWorkflowState to replace it with.
      setWorkflowState({ ...workflowState, activeHolds: data.activeHolds ?? [] });
      return;
    }

    setWorkflowState(data.guidedWorkflowState);
  }

  async function handleResolveHold(holdId: string, holdResolutionText: string) {
    if (!workflowState) return;
    const data = await postGuidedAction({ action: "resolveHold", guidedWorkflowState: workflowState, holdId, holdResolutionText });
    if (data && !isHoldBlockedResponse(data)) setWorkflowState(data.guidedWorkflowState);
  }

  async function handleAcknowledgeFlag(flagId: string) {
    if (!workflowState) return;
    const data = await postGuidedAction({ action: "acknowledgeFlag", guidedWorkflowState: workflowState, flagId });
    if (!data) return;
    if (isHoldBlockedResponse(data)) {
      // FlagAcknowledgmentBlockedByHoldError — a HOLD appeared on this step
      // since the page last fetched state. Merge it in the same way as advance.
      setWorkflowState({ ...workflowState, activeHolds: data.activeHolds ?? [] });
      return;
    }
    setWorkflowState(data.guidedWorkflowState);
  }

  async function handleDefer(reason: Exclude<DeferralOption, "cancel_deferral">) {
    if (!workflowState) return;
    const data = await postGuidedAction({ action: "defer", guidedWorkflowState: workflowState, deferralReason: reason });
    if (data && !isHoldBlockedResponse(data)) setWorkflowState(data.guidedWorkflowState);
  }

  function handleAskAdvisor(step: WorkflowStepDefinition) {
    setInlineAdvisoryStepContext({
      stepId: step.step_id,
      stepTitle: step.step_title,
      corpusAuthority: step.corpus_authority,
      attribute: step.attribute ?? step.step_title,
    });
    setInlineAdvisoryOpen(true);
  }

  function handleCloseInlineAdvisory() {
    // Closing the panel never touches workflowState — Guided Workflow state
    // is fully preserved per the brief's "Ask Advisor" requirement.
    setInlineAdvisoryOpen(false);
  }

  async function handleExport() {
    if (!workflowState) return;

    const response = await fetch("/api/audit/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guidedWorkflowState: workflowState, workflowSteps, talDomain }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? `Audit export failed (${response.status}).`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    link.download = filenameMatch ? filenameMatch[1] : "kalder_audit.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleReturn() {
    setWorkflowState(null);
    setWorkflowSteps([]);
    setSubmittedStepValues({});
    setError(null);
  }

  const talDomain = typeof submittedStepValues[1] === "string" ? (submittedStepValues[1] as string) : "unknown";

  const currentStepDefinition = workflowState ? workflowSteps.find((s) => s.step_id === workflowState.currentStep) : undefined;
  const isComplete = workflowState !== null && workflowSteps.length > 0 && workflowState.currentStep > workflowSteps.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
      {error && (
        <div className="rounded-md border border-kalder-hold/40 bg-kalder-hold/[0.08] px-3 py-2 text-sm text-kalder-hold">
          {error}
        </div>
      )}

      {!workflowState && <WorkflowSelector onSelect={handleSelectWorkflow} />}

      {workflowState && !isComplete && currentStepDefinition && (
        <StepCard
          step={currentStepDefinition}
          state={workflowState}
          totalSteps={workflowSteps.length}
          onAdvance={handleAdvance}
          onResolveHold={handleResolveHold}
          onAcknowledgeFlag={handleAcknowledgeFlag}
          onDefer={handleDefer}
          onAskAdvisor={() => handleAskAdvisor(currentStepDefinition)}
        />
      )}

      {workflowState && isComplete && (
        <CompletionScreen
          state={workflowState}
          workflowSteps={workflowSteps}
          talDomain={talDomain}
          onExport={handleExport}
          onReturn={handleReturn}
        />
      )}

      {isLoading && <p className="text-xs text-muted-foreground">Working...</p>}

      {inlineAdvisoryStepContext && (
        <InlineAdvisoryPanel
          isOpen={inlineAdvisoryOpen}
          onClose={handleCloseInlineAdvisory}
          stepContext={inlineAdvisoryStepContext}
        />
      )}
    </div>
  );
}
